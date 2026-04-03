"""
train_loop.py
=============
Walk-Forward-Training des Agenten über historische Daten von 2002 bis 2026.

Funktionsweise:
  - Teilt den Zeitraum in überlappende Fenster (Standard: 6 Monate, Schritt: 3 Monate)
  - Für jedes Fenster: Daten holen → Backtest → Agent lernt aus jedem Trade
  - Automatische Schlafpausen zwischen Requests (Yahoo Finance Rate-Limit)
  - Fortschritt wird geloggt und als JSON gespeichert
  - Kann als Cron-Job oder einmalig ausgeführt werden

Aufruf:
  python train_loop.py                      # Vollständiger Lauf 2002–2026
  python train_loop.py --dry-run            # Nur Fenster anzeigen, kein Training
  python train_loop.py --from 2018-01-01    # Ab bestimmtem Datum fortsetzen
  python train_loop.py --tickers AAPL,MSFT  # Nur bestimmte Ticker

Cron-Job (täglich um 02:00 Uhr, nimmt das letzte Quartal):
  0 2 * * * cd /path/to/trading-agent/backend && python train_loop.py --last-quarter
"""

import argparse
import json
import sys
import time
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from pathlib import Path

# ── Konfiguration ──────────────────────────────────────────────────────────────

TRAIN_START      = "2002-01-01"
TRAIN_END        = "2026-03-01"
WINDOW_MONTHS    = 6     # Länge jedes Trainingsfensters
STEP_MONTHS      = 3     # Versatz zwischen Fenstern (Überlappung 50%)

# Diversifiziertes Ticker-Set: US-Markt, Tech, Rohstoffe, ETFs
DEFAULT_TICKERS = [
    "SPY", "QQQ", "DIA",         # US-Indizes
    "AAPL", "MSFT", "NVDA",      # Tech
    "AMZN", "GOOGL", "META",     # Big Tech
    "TSLA", "JPM", "GS",         # Weitere Sektoren
    "GLD", "TLT", "VIX",         # Rohstoffe / Anleihen / Volatilität
]

PROFILES = ["momentum", "swing", "position"]

# Sleep-Zeiten (Yahoo Finance toleriert ~2-3 Requests/Sekunde)
SLEEP_TICKER     = 0.8   # Sekunden zwischen Ticker-Requests
SLEEP_WINDOW     = 3.0   # Sekunden zwischen Fenstern
SLEEP_PROFILE    = 0.2   # Sekunden zwischen Profilen

# Use /tmp on Railway (ephemeral but writable), fallback to local data/
_DATA_DIR = Path("/tmp") if Path("/tmp").exists() and os.access("/tmp", os.W_OK) else Path(__file__).parent / "data"
PROGRESS_FILE    = _DATA_DIR / "train_progress.json"
LOG_FILE         = _DATA_DIR / "train_loop.log"

# ── Setup ──────────────────────────────────────────────────────────────────────

sys.path.insert(0, str(Path(__file__).parent))

from core.agent    import TradingAgent
from core.backtest import BacktestConfig, run_backtest

STATE_FILE = str(Path(__file__).parent / "data" / "state" / "agent_state.json")


def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def generate_windows(start: str, end: str, window_months: int, step_months: int):
    """Erzeugt überlappende Zeitfenster zwischen start und end."""
    windows = []
    cur = datetime.strptime(start, "%Y-%m-%d")
    end_dt = datetime.strptime(end, "%Y-%m-%d")
    while cur < end_dt:
        win_end = cur + relativedelta(months=window_months)
        if win_end > end_dt:
            win_end = end_dt
        windows.append((cur.strftime("%Y-%m-%d"), win_end.strftime("%Y-%m-%d")))
        cur += relativedelta(months=step_months)
    return windows


def save_progress(window_idx: int, total: int, stats: dict):
    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "window": window_idx,
        "total": total,
        "pct": round(window_idx / total * 100, 1),
        "updated_at": datetime.now().isoformat(),
        **stats,
    }
    PROGRESS_FILE.write_text(json.dumps(data, indent=2))


def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        try:
            return json.loads(PROGRESS_FILE.read_text())
        except Exception:
            pass
    return {}


# ── Hauptschleife ──────────────────────────────────────────────────────────────

def run_training(
    tickers: list,
    start: str,
    end: str,
    window_months: int = WINDOW_MONTHS,
    step_months: int = STEP_MONTHS,
    resume: bool = True,
    dry_run: bool = False,
):
    agent = TradingAgent(state_file=STATE_FILE)
    windows = generate_windows(start, end, window_months, step_months)
    total = len(windows)

    log(f"Training startet: {start} → {end}")
    log(f"Fenster: {total} × {window_months}M (Schritt: {step_months}M)")
    log(f"Ticker: {', '.join(tickers)}")
    log(f"Profile: {', '.join(PROFILES)}")

    if dry_run:
        log("DRY-RUN: Fenster werden nur angezeigt")
        for i, (ws, we) in enumerate(windows):
            print(f"  [{i+1:3d}/{total}] {ws} → {we}")
        return

    # Fortschritt wiederherstellen
    start_idx = 0
    if resume:
        prog = load_progress()
        if prog.get("total") == total and prog.get("window", 0) > 0:
            start_idx = prog["window"]
            log(f"Fortschritt wiederhergestellt: ab Fenster {start_idx + 1}")

    total_trades  = 0
    total_wins    = 0
    errors        = 0

    for i, (win_start, win_end) in enumerate(windows):
        if i < start_idx:
            continue

        log(f"Fenster [{i+1}/{total}] {win_start} → {win_end}")

        window_trades = 0
        window_wins   = 0

        for ticker in tickers:
            for profile in PROFILES:
                try:
                    config = BacktestConfig(
                        ticker=ticker,
                        profile=profile,
                        start_date=win_start,
                        end_date=win_end,
                        initial_capital=10_000.0,
                        commission=0.001,
                    )
                    result = run_backtest(config, agent)
                    t = result.metrics.get("total_trades", 0)
                    w = result.metrics.get("wins", 0)
                    window_trades += t
                    window_wins   += w

                except Exception as e:
                    errors += 1
                    log(f"  FEHLER {ticker}/{profile}: {e}")

                time.sleep(SLEEP_TICKER)
            time.sleep(SLEEP_PROFILE)

        total_trades += window_trades
        total_wins   += window_wins
        win_rate = round(total_wins / total_trades * 100, 1) if total_trades else 0

        log(f"  → {window_trades} Trades | Gesamt: {total_trades} Trades | Win-Rate: {win_rate}%")

        # Zwischenspeichern
        agent.save_state()
        save_progress(i + 1, total, {
            "total_trades": total_trades,
            "total_wins":   total_wins,
            "win_rate":     win_rate,
            "errors":       errors,
            "last_window":  f"{win_start} → {win_end}",
            "weights":      agent.get_weights(),
        })

        time.sleep(SLEEP_WINDOW)

    log(f"Training abgeschlossen!")
    log(f"  Gesamt-Trades: {total_trades} | Wins: {total_wins} | Win-Rate: {round(total_wins/total_trades*100,1) if total_trades else 0}%")
    log(f"  Fehler: {errors}")
    log(f"  Finale Gewichte: {agent.get_weights()}")


def run_last_quarter(tickers: list):
    """Trainiert nur das letzte Quartal (für Cron-Job)."""
    end   = datetime.today()
    start = end - relativedelta(months=3)
    log("Cron-Modus: letztes Quartal")
    run_training(
        tickers=tickers,
        start=start.strftime("%Y-%m-%d"),
        end=end.strftime("%Y-%m-%d"),
        window_months=3,
        step_months=3,
        resume=False,
    )


# ── CLI ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Walk-Forward-Training des Trading-Agenten")
    parser.add_argument("--dry-run",      action="store_true",        help="Nur Fenster anzeigen, kein Training")
    parser.add_argument("--last-quarter", action="store_true",        help="Nur letztes Quartal trainieren (Cron-Modus)")
    parser.add_argument("--from",         dest="from_date", default=TRAIN_START, help=f"Startdatum (Standard: {TRAIN_START})")
    parser.add_argument("--to",           dest="to_date",   default=TRAIN_END,   help=f"Enddatum (Standard: {TRAIN_END})")
    parser.add_argument("--tickers",      default="",                 help="Kommaseparierte Ticker (Standard: eingebaut)")
    parser.add_argument("--no-resume",    action="store_true",        help="Nicht vom letzten Fortschritt fortsetzen")
    parser.add_argument("--window",       type=int, default=WINDOW_MONTHS, help=f"Fenstergröße in Monaten (Standard: {WINDOW_MONTHS})")
    parser.add_argument("--step",         type=int, default=STEP_MONTHS,   help=f"Schrittweite in Monaten (Standard: {STEP_MONTHS})")
    args = parser.parse_args()

    tickers = [t.strip().upper() for t in args.tickers.split(",") if t.strip()] or DEFAULT_TICKERS

    if args.last_quarter:
        run_last_quarter(tickers)
    else:
        run_training(
            tickers=tickers,
            start=args.from_date,
            end=args.to_date,
            window_months=args.window,
            step_months=args.step,
            resume=not args.no_resume,
            dry_run=args.dry_run,
        )
