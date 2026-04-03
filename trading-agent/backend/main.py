"""FastAPI trading agent backend server."""
import os
from typing import List, Optional, Any, Dict
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

from data.fetcher import fetch_ohlcv, fetch_multiple, CRISIS_EPISODES
from core.indicators import compute_all
from core.scoring import PROFILES, get_signal, get_recommendation
from core.agent import TradingAgent
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
claude = ClaudeAnalyst(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

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

    score_fn = PROFILES[profile]
    data = fetch_multiple(ticker_list, period="1y")

    results = []
    for ticker, df in data.items():
        if df.empty or len(df) < 50:
            continue
        indicators = compute_all(df)
        if not indicators:
            continue
        score = score_fn(indicators)
        signal = get_signal(score)
        rec = get_recommendation(score, profile, indicators)
        results.append(
            ScanResult(
                ticker=ticker,
                score=round(score, 2),
                signal=signal,
                profile=profile,
                indicators=indicators,
                recommendation=rec,
            )
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
    """Run a walk-forward backtest."""
    config = BacktestConfig(
        ticker=req.ticker.upper(),
        profile=req.profile,
        start_date=req.start_date,
        end_date=req.end_date,
        initial_capital=req.initial_capital,
        commission=req.commission,
    )
    result = run_backtest(config, agent)
    return {
        "equity_curve": result.equity_curve,
        "trades": result.trades,
        "metrics": result.metrics,
        "config": result.config,
    }


@app.get("/api/crisis")
async def get_crises():
    """List all crisis episodes."""
    return list(CRISIS_EPISODES.values())


@app.post("/api/crisis/backtest")
async def crisis_backtest(req: CrisisBacktestRequest):
    """Run backtest over a specific crisis episode."""
    result = run_crisis_backtest(
        ticker=req.ticker.upper(),
        profile=req.profile,
        crisis_id=req.crisis_id,
        agent=agent,
        initial_capital=req.capital,
    )
    return {
        "equity_curve": result.equity_curve,
        "trades": result.trades,
        "metrics": result.metrics,
        "config": result.config,
        "crisis": CRISIS_EPISODES.get(req.crisis_id, {}),
    }


@app.get("/api/agent/state")
async def get_agent_state():
    """Return agent state summary."""
    stats = agent.get_stats()
    recent_predictions = agent.state.predictions[-10:]  # last 10
    open_trades = [t for t in agent.state.paper_trades if t.get("is_open", True)]
    weights = agent.state.weights

    return {
        "stats": stats,
        "weights": weights,
        "recent_predictions": recent_predictions,
        "open_trades": open_trades,
        "created_at": agent.state.created_at,
        "updated_at": agent.state.updated_at,
    }


@app.post("/api/agent/feedback")
async def submit_feedback(req: FeedbackRequest):
    """Record prediction outcome and update agent weights."""
    success = agent.record_outcome(req.prediction_id, req.actual_return_pct)
    if not success:
        raise HTTPException(404, f"Prediction {req.prediction_id} not found")

    stats = agent.get_stats()
    return {"success": True, "updated_stats": stats}


@app.post("/api/agent/trade")
async def paper_trade(req: TradeRequest):
    """Record a paper trade entry."""
    trade = agent.paper_trade(
        ticker=req.ticker.upper(),
        action=req.action,
        shares=req.shares,
        price=req.price,
        profile=req.profile,
    )
    from dataclasses import asdict
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

    if claude is None:
        # Return fallback without Claude
        analyst = ClaudeAnalyst(api_key="")
        analysis = analyst._fallback_analysis(ticker, indicators, req.profile)
    else:
        analysis = claude.analyze(
            ticker=ticker,
            indicators=indicators,
            profile=req.profile,
            context=req.context,
        )

    return {**analysis, "indicators": indicators}


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("ML_API_HOST", "0.0.0.0")
    port = int(os.getenv("ML_API_PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
