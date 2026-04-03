"""
backend/core/claude_analyst.py
Claude AI Integration für Trading-Analyse.
Nutzt die Anthropic API für kontextuelle Marktanalysen.
"""

import os
from .scoring import StockScore
from .agent import AgentState

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

SYSTEM_PROMPT = """Du bist ein erfahrener quantitativer Trading-Analyst mit Fokus auf technische Chartanalyse.
Du analysierst Aktien und Märkte präzise, prägnant und auf Deutsch.

Deine Regeln:
- Nenne immer konkrete Kurs-Niveaus (Einstieg, Stop-Loss, Ziel 1, Ziel 2)
- Nutze die berechneten Indikatoren als Basis, ergänze um Kontext
- Unterscheide klar zwischen Momentum- (1–5 Tage), Swing- (1–8 Wochen) und Positionssignalen (3–12 Monate)
- Sage deutlich wenn Signale widersprüchlich sind
- Kein Haftungsausschluss — direkte, klare Sprache
- Maximal 200 Wörter pro Analyse
"""


def _format_signals(scores: list[StockScore]) -> str:
    lines = []
    for s in scores:
        lines.append(
            f"{s.ticker} | Kurs: ${s.price:.2f} | Signal: {s.signal.upper()} | Score: {s.total_score:.1f}\n"
            f"  Momentum: {s.horizons.momentum:.1f} | Swing: {s.horizons.swing:.1f} | Position: {s.horizons.position:.1f}\n"
            f"  RSI: {s.ind.rsi:.1f} | MACD-Hist: {s.ind.macd_hist:+.4f} | "
            f"EMA9/21: {'↑' if s.ind.ema9 > s.ind.ema21 else '↓'} | "
            f"Supertrend: {'↑' if s.ind.supertrend_above else '↓'} | Fib: {s.ind.fib_level*100:.0f}%\n"
            f"  ATR: {s.ind.atr:.2f} | Vol-Ratio: {s.ind.volume_ratio:.1f}x | "
            f"52W-Dist: -{s.ind.dist_52h*100:.1f}% vom Hoch\n"
            f"  Stop-Loss: ${s.stop_loss:.2f} | Ziel 1: ${s.target_1:.2f} | Ziel 2: ${s.target_2:.2f}\n"
            f"  Gründe: {', '.join(s.reasons[:3])}"
        )
    return "\n\n".join(lines)


async def analyze_signals(
    scores: list[StockScore],
    profile: str,
    api_key: str | None = None,
) -> str:
    key = api_key or os.getenv("ANTHROPIC_API_KEY", "")
    if not key or not HAS_ANTHROPIC:
        return _demo_analysis(scores, profile)

    client = anthropic.Anthropic(api_key=key)
    prompt = (
        f"Profil: {profile.upper()}\n\n"
        f"Analysiere folgende {len(scores)} Aktie(n):\n\n"
        f"{_format_signals(scores)}\n\n"
        f"Fasse am Ende die 1–2 besten Chancen zusammen."
    )
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6", max_tokens=600,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
    except Exception as e:
        return f"API-Fehler: {e}\n\n{_demo_analysis(scores, profile)}"


async def analyze_portfolio(
    positions: list[dict],
    scores: list[StockScore],
    api_key: str | None = None,
) -> str:
    key = api_key or os.getenv("ANTHROPIC_API_KEY", "")
    if not key or not HAS_ANTHROPIC:
        return _demo_portfolio_analysis(positions, scores)

    client = anthropic.Anthropic(api_key=key)
    depot_lines = []
    for p in positions:
        s = next((x for x in scores if x.ticker == p["ticker"]), None)
        buy = p.get("buy_price", p.get("einstandKurs", 0))
        cur = p.get("current", buy)
        pnl = (cur - buy) / buy * 100 if buy else 0
        line = f"{p['ticker']}: {p.get('qty', p.get('stueck', 0))} Stk. | Kauf ${buy:.2f} | P&L {pnl:+.1f}%"
        if s:
            line += f" | Signal: {s.signal.upper()} | Score: {s.total_score:.1f}"
        depot_lines.append(line)

    prompt = (
        f"Depot ({len(positions)} Positionen):\n\n" + "\n".join(depot_lines)
        + "\n\nGib für jede Position: Halten / Teilverkauf / Nachkauf / Absichern. "
          "Nenne Stop-Loss-Niveaus und bewerte das Gesamtrisiko."
    )
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6", max_tokens=700,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
    except Exception as e:
        return f"API-Fehler: {e}"


async def analyze_backtest_learnings(
    agent_state: AgentState,
    crisis_results: list[dict],
    api_key: str | None = None,
) -> str:
    key = api_key or os.getenv("ANTHROPIC_API_KEY", "")
    if not key or not HAS_ANTHROPIC:
        return "Claude-Analyse: API-Key in Einstellungen eintragen für vollständige Lernauswertung."

    client = anthropic.Anthropic(api_key=key)
    weights_str = "\n".join(f"  {k.upper()}: {v*100:.1f}%" for k, v in agent_state.weights.items())
    crisis_str  = "\n".join(
        f"  {r.get('name')}: {r.get('win_rate', 0):.1f}% Win-Rate ({r.get('trades', 0)} Trades)"
        for r in crisis_results
    )
    prompt = (
        f"Agent: {len(agent_state.trades)} Paper-Trades\n\n"
        f"Gewichte:\n{weights_str}\n\nKrisentraining:\n{crisis_str}\n\n"
        "Was sagen die Gewichte aus? Wo ist der Agent schwach? Was optimieren?"
    )
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6", max_tokens=500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
    except Exception as e:
        return f"API-Fehler: {e}"


def _demo_analysis(scores: list[StockScore], profile: str) -> str:
    lines = [f"Trading-Analyse ({profile.upper()}) — Demo-Modus (kein API-Key):\n"]
    for s in scores:
        emoji = "🟢" if s.signal == "long" else "🔴" if s.signal == "short" else "🟡"
        lines.append(
            f"{emoji} {s.ticker}: {s.signal.upper()} | Score {s.total_score:+.1f}\n"
            f"   Stop: ${s.stop_loss:.2f} | Ziel 1: ${s.target_1:.2f} | Ziel 2: ${s.target_2:.2f}\n"
            f"   {', '.join(s.reasons[:2]) or 'Indikatoren neutral'}"
        )
    lines.append("\nAPI-Key unter Einstellungen eintragen für KI-Analyse.")
    return "\n".join(lines)


def _demo_portfolio_analysis(positions: list[dict], scores: list[StockScore]) -> str:
    lines = ["Depot-Analyse — Demo-Modus:\n"]
    for p in positions:
        s = next((x for x in scores if x.ticker == p["ticker"]), None)
        action = "HALTEN"
        if s:
            if s.signal == "long" and s.total_score > 5:   action = "NACHKAUFEN"
            elif s.signal == "short" or s.total_score < -3: action = "VERKAUFEN / ABSICHERN"
        lines.append(f"  {p['ticker']}: {action}")
    return "\n".join(lines)
