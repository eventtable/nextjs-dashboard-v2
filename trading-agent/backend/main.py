"""FastAPI trading agent backend server."""
import asyncio
import os
import threading
from concurrent.futures import ThreadPoolExecutor
from typing import List, Any, Dict, Optional
from datetime import datetime

_executor = ThreadPoolExecutor(max_workers=4)

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from data.fetcher import fetch_ohlcv, fetch_multiple, CRISIS_EPISODES
from core.indicators import compute_all
from core.scoring import score_stock, get_signal, get_recommendation, PROFILES
from core.agent import TradingAgent, _dict_to_indicator_result
from core.backtest import BacktestConfig, run_backtest, run_crisis_backtest
from core.claude_analyst import ClaudeAnalyst

# ── App setup ──────────────────────────────────────────────────────────────────

app = FastAPI(title="Trading Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global instances ───────────────────────────────────────────────────────────

STATE_FILE = os.path.join(os.path.dirname(__file__), "data", "state", "agent_state.json")
os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)

agent = TradingAgent(state_file=STATE_FILE)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
claude = ClaudeAnalyst(api_key=ANTHROPIC_API_KEY)

# ── Pydantic models ────────────────────────────────────────────────────────────


class ScanResult(BaseModel):
    ticker: str
    score: float
    signal: str
    profile: str
    indicators: Dict[str, Any]
    recommendation: Dict[str, Any]


class PredictionResponse(BaseModel):
    id: str
    ticker: str
    profile: str
    score: float
    signal: str
    confidence: float
    timestamp: str
    indicators: Dict[str, Any]
    recommendation: Dict[str, Any]


class BacktestRequest(BaseModel):
    ticker: str
    profile: str
    start_date: str
    end_date: str
    initial_capital: float = 10000.0
    commission: float = 0.001


class CrisisBacktestRequest(BaseModel):
    ticker: str
    crisis_id: str
    profile: str = "momentum"
    capital: float = 10000.0


class FeedbackRequest(BaseModel):
    prediction_id: str
    actual_return_pct: float


class TradeRequest(BaseModel):
    ticker: str
    action: str
    shares: float
    price: float
    profile: str = "momentum"


class CloseTradeRequest(BaseModel):
    trade_id: str
    exit_price: float


class ClaudeAnalysisRequest(BaseModel):
    ticker: str
    profile: str = "momentum"
    context: str = ""


class TrainRequest(BaseModel):
    tickers: Optional[List[str]] = None
    from_date: str = "2002-01-01"
    to_date: str = "2026-03-01"
    window_months: int = 6
    step_months: int = 3


# ── Routes ─────────────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/scanner", response_model=List[ScanResult])
async def scanner(
    tickers: str = Query(default="AAPL,MSFT,NVDA,SPY,QQQ"),
    profile: str = Query(default="momentum"),
    top_n: int = Query(default=10, ge=1, le=50),
):
    """Scan multiple tickers and return scored results."""
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not ticker_list:
        raise HTTPException(400, "No tickers provided")

    if profile not in PROFILES:
        raise HTTPException(400, f"Unknown profile: {profile}. Use: {list(PROFILES.keys())}")

    data = fetch_multiple(ticker_list, period="1y")
    weights = agent.get_weights()

    results = []
    failed = []
    for ticker, df in data.items():
        if df.empty or len(df) < 50:
            failed.append(ticker)
            continue
        indicators = compute_all(df)
        if not indicators:
            failed.append(ticker)
            continue
        price = indicators.get("price", 0.0)
        ind = _dict_to_indicator_result(indicators, price)
        scored = score_stock(ticker, price, ind, profile, weights)
        rec = get_recommendation(scored.total_score, profile, indicators)
        rec["stop_loss"] = scored.stop_loss
        rec["target_1"]  = scored.target_1
        rec["target_2"]  = scored.target_2
        results.append(
            ScanResult(
                ticker=ticker,
                score=round(scored.total_score, 2),
                signal=scored.signal,
                profile=profile,
                indicators=indicators,
                recommendation=rec,
            )
        )

    if failed:
        print(f"[scanner] Keine Daten für: {', '.join(failed)}")

    if not results:
        raise HTTPException(
            status_code=422,
            detail=f"Keine Daten für Ticker: {', '.join(failed)}. Ticker-Symbole prüfen (z.B. AAPL, SAP.DE).",
        )

    results.sort(key=lambda x: x.score, reverse=True)
    return results[:top_n]


@app.get("/api/predict", response_model=PredictionResponse)
async def predict(
    ticker: str = Query(...),
    profile: str = Query(default="momentum"),
):
    """Generate a prediction for a single ticker."""
    ticker = ticker.upper()
    if profile not in PROFILES:
        raise HTTPException(400, f"Unknown profile: {profile}")

    df = fetch_ohlcv(ticker, period="1y")
    if df.empty or len(df) < 50:
        raise HTTPException(404, f"No data available for {ticker}")

    indicators = compute_all(df)
    if not indicators:
        raise HTTPException(500, f"Could not compute indicators for {ticker}")

    prediction = agent.predict(ticker, indicators, profile)
    rec = get_recommendation(prediction.score, profile, indicators)

    return PredictionResponse(
        id=prediction.id,
        ticker=prediction.ticker,
        profile=prediction.profile,
        score=prediction.score,
        signal=prediction.signal,
        confidence=prediction.confidence,
        timestamp=prediction.timestamp,
        indicators=indicators,
        recommendation=rec,
    )


@app.post("/api/backtest")
async def backtest(req: BacktestRequest):
    """Run a walk-forward backtest with a 30s timeout."""
    config = BacktestConfig(
        ticker=req.ticker.upper(),
        profile=req.profile,
        start_date=req.start_date,
        end_date=req.end_date,
        initial_capital=req.initial_capital,
        commission=req.commission,
    )
    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(_executor, run_backtest, config, agent),
            timeout=30.0,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Backtest timeout (>30s) — Zeitraum verkürzen oder später erneut versuchen")
    return {
        "equity_curve": result.equity_curve,
        "trades":       result.trades,
        "metrics":      result.metrics,
        "config":       result.config,
    }


@app.get("/api/crisis")
async def get_crises():
    """List all crisis episodes."""
    return list(CRISIS_EPISODES.values())


@app.post("/api/crisis/backtest")
async def crisis_backtest(req: CrisisBacktestRequest):
    """Run backtest over a specific crisis episode with a 30s timeout."""
    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(
                _executor, run_crisis_backtest,
                req.ticker.upper(), req.profile, req.crisis_id, agent, req.capital,
            ),
            timeout=30.0,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Backtest timeout (>30s) — Krisenperiode oder Ticker prüfen")
    return {
        "equity_curve": result.equity_curve,
        "trades":       result.trades,
        "metrics":      result.metrics,
        "config":       result.config,
        "crisis":       CRISIS_EPISODES.get(req.crisis_id, {}),
    }


@app.get("/api/agent/state")
async def get_agent_state():
    """Return agent state summary."""
    stats = agent.get_stats()
    recent_predictions = agent.state.predictions[-10:]
    open_trades = [t for t in agent.state.paper_trades if t.get("is_open", True)]
    return {
        "stats":               stats,
        "weights":             agent.state.weights,
        "recent_predictions":  recent_predictions,
        "open_trades":         open_trades,
        "created_at":          agent.state.created_at,
        "updated_at":          agent.state.updated_at,
    }


@app.post("/api/agent/reset")
async def reset_agent():
    """Reset agent state to defaults."""
    agent.reset()
    return {"success": True, "message": "Agent zurückgesetzt"}


@app.post("/api/agent/feedback")
async def submit_feedback(req: FeedbackRequest):
    """Record prediction outcome and update agent weights."""
    success = agent.record_outcome(req.prediction_id, req.actual_return_pct)
    if not success:
        raise HTTPException(404, f"Prediction {req.prediction_id} not found")
    return {"success": True, "updated_stats": agent.get_stats()}


@app.post("/api/agent/trade")
async def paper_trade(req: TradeRequest):
    """Record a paper trade entry."""
    from dataclasses import asdict
    trade = agent.paper_trade(
        ticker=req.ticker.upper(),
        action=req.action,
        shares=req.shares,
        price=req.price,
        profile=req.profile,
    )
    return asdict(trade)


@app.post("/api/agent/close-trade")
async def close_trade(req: CloseTradeRequest):
    """Close an open paper trade."""
    result = agent.close_trade(req.trade_id, req.exit_price)
    if result is None:
        raise HTTPException(404, f"Open trade {req.trade_id} not found")
    return result


@app.post("/api/claude-analysis")
async def claude_analysis(req: ClaudeAnalysisRequest):
    """Fetch data, compute indicators, run Claude analysis."""
    ticker = req.ticker.upper()

    df = fetch_ohlcv(ticker, period="1y")
    if df.empty or len(df) < 50:
        raise HTTPException(404, f"No data for {ticker}")

    indicators = compute_all(df)
    if not indicators:
        raise HTTPException(500, f"Could not compute indicators for {ticker}")

    analysis = claude.analyze(
        ticker=ticker,
        indicators=indicators,
        profile=req.profile,
        context=req.context,
    )
    return {**analysis, "indicators": indicators}


# ── Ticker search ─────────────────────────────────────────────────────────────

@app.get("/api/search")
async def search_ticker(q: str = Query(..., min_length=2)):
    """Search for ticker symbols by company name or symbol."""
    import yfinance as yf
    try:
        results = yf.Search(q, max_results=8).quotes
        out = []
        for r in results:
            symbol = r.get("symbol", "")
            name   = r.get("longname") or r.get("shortname") or symbol
            exch   = r.get("exchange", "")
            qtype  = r.get("quoteType", "")
            if symbol and qtype in ("EQUITY", "ETF", "INDEX"):
                out.append({"symbol": symbol, "name": name, "exchange": exch})
        return out[:6]
    except Exception as e:
        return []


# ── Training state ────────────────────────────────────────────────────────────

_train_lock = threading.Lock()
_train_thread: Optional[threading.Thread] = None
_train_status: Dict[str, Any] = {"running": False, "progress": None, "error": None}


def _run_training_thread(req: TrainRequest):
    global _train_status
    import traceback
    try:
        from train_loop import run_training, DEFAULT_TICKERS
        tickers = req.tickers or DEFAULT_TICKERS
        _train_status["running"] = True
        _train_status["error"] = None
        _train_status["started_at"] = datetime.now().isoformat()
        run_training(
            tickers=tickers,
            start=req.from_date,
            end=req.to_date,
            window_months=req.window_months,
            step_months=req.step_months,
            resume=True,
        )
    except Exception as e:
        _train_status["error"] = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
        print(f"[TRAIN ERROR] {_train_status['error']}", flush=True)
    finally:
        _train_status["running"] = False
        # Refresh in-memory agent from the state file the training loop wrote
        try:
            agent.reload()
        except Exception:
            pass


@app.post("/api/agent/train")
async def start_training(req: TrainRequest):
    """Start walk-forward training in background thread."""
    global _train_thread, _train_status
    with _train_lock:
        if _train_status.get("running"):
            return {"started": False, "already_running": True, "progress": _get_progress()}

        _train_thread = threading.Thread(target=_run_training_thread, args=(req,), daemon=True)
        _train_thread.start()
        return {"started": True, "message": "Training gestartet"}


def _get_progress():
    from pathlib import Path
    import json
    for candidate in [Path("/tmp/train_progress.json"),
                      Path(__file__).parent / "data" / "train_progress.json"]:
        if candidate.exists():
            try:
                return json.loads(candidate.read_text())
            except Exception:
                pass
    return None


@app.get("/api/agent/train/status")
async def training_status():
    """Get current training progress."""
    return {
        "running":  _train_status.get("running", False),
        "error":    _train_status.get("error"),
        "progress": _get_progress(),
        "started":  _train_status.get("started_at"),
    }


@app.post("/api/agent/train/clear-error")
async def clear_train_error():
    _train_status["error"] = None
    return {"ok": True}


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("ML_API_HOST", "0.0.0.0")
    port = int(os.getenv("ML_API_PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
