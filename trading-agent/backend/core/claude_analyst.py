"""
backend/core/claude_analyst.py
Claude AI Integration für Trading-Analyse.
Nutzt die Anthropic API für kontextuelle Marktanalysen.
"""

import os

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


class ClaudeAnalyst:
    """Synchronous wrapper for Claude-powered trading analysis."""

    def __init__(self, api_key: str = ""):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY", "")

    def analyze(self, ticker: str, indicators: dict, profile: str, context: str = "") -> dict:
        """Analyze a single ticker and return a structured result dict."""
        if not self.api_key or not HAS_ANTHROPIC:
            return self._fallback_analysis(ticker, indicators, profile)

        price   = indicators.get("price", 0.0)
        rsi     = indicators.get("rsi", 50.0)
        macd_h  = indicators.get("macd_hist", 0.0)
        atr     = indicators.get("atr", price * 0.02)
        adx     = indicators.get("adx", 20.0)

        prompt = (
            f"Profil: {profile.upper()}\n"
            f"Ticker: {ticker} | Kurs: ${price:.2f}\n"
            f"RSI: {rsi:.1f} | MACD-Hist: {macd_h:+.4f} | ADX: {adx:.0f} | ATR: {atr:.2f}\n"
            f"Supertrend: {'bullisch' if indicators.get('supertrend_direction', 1) >= 0 else 'bärisch'}\n"
        )
        if context:
            prompt += f"\nKontext: {context}\n"
        prompt += "\nGib eine prägnante Analyse mit konkreten Kurszielen."

        try:
            client = anthropic.Anthropic(api_key=self.api_key)
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=500,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            analysis_text = response.content[0].text
        except Exception as e:
            analysis_text = f"API-Fehler: {e}"

        return self._build_result(ticker, indicators, profile, analysis_text)

    def _fallback_analysis(self, ticker: str, indicators: dict, profile: str) -> dict:
        """Rule-based fallback when no API key is available."""
        price = indicators.get("price", 0.0)
        rsi   = indicators.get("rsi", 50.0)
        macd_h = indicators.get("macd_hist", 0.0)
        atr   = indicators.get("atr", price * 0.02)
        st_up = indicators.get("supertrend_direction", 1) >= 0

        signals = []
        score = 0.0

        if rsi < 35:
            signals.append(f"RSI {rsi:.1f} — überverkauft (Kaufzone)")
            score += 2.0
        elif rsi > 65:
            signals.append(f"RSI {rsi:.1f} — überkauft (Vorsicht)")
            score -= 2.0

        if macd_h > 0:
            signals.append("MACD-Histogramm positiv — bullischer Impuls")
            score += 1.5
        else:
            signals.append("MACD-Histogramm negativ — bärischer Druck")
            score -= 1.5

        if st_up:
            signals.append("Supertrend bullisch — Aufwärtstrend intakt")
            score += 1.5
        else:
            signals.append("Supertrend bärisch — Abwärtstrend")
            score -= 1.5

        if score > 2:
            action = "LONG"
            stop_loss = round(price - 1.5 * atr, 2)
            target_1  = round(price + 2.0 * atr, 2)
            target_2  = round(price + 4.0 * atr, 2)
        elif score < -2:
            action = "SHORT / MEIDEN"
            stop_loss = round(price + 1.5 * atr, 2)
            target_1  = round(price - 2.0 * atr, 2)
            target_2  = round(price - 4.0 * atr, 2)
        else:
            action = "NEUTRAL / BEOBACHTEN"
            stop_loss = round(price - atr, 2)
            target_1  = round(price + atr, 2)
            target_2  = round(price + 2 * atr, 2)

        text = (
            f"[Demo-Modus — kein API-Key]\n\n"
            f"{ticker} ({profile.upper()}): {action}\n\n"
            + "\n".join(f"• {s}" for s in signals)
            + f"\n\nStop-Loss: ${stop_loss} | Ziel 1: ${target_1} | Ziel 2: ${target_2}\n"
            f"API-Key unter Einstellungen eintragen für vollständige KI-Analyse."
        )

        return self._build_result(ticker, indicators, profile, text, stop_loss, target_1, target_2)

    def _build_result(self, ticker: str, indicators: dict, profile: str, analysis_text: str,
                       stop_loss: float = 0.0, target_1: float = 0.0, target_2: float = 0.0) -> dict:
        price = indicators.get("price", 0.0)
        atr   = indicators.get("atr", price * 0.02)
        if not stop_loss:
            stop_loss = round(price - 1.5 * atr, 2)
        if not target_1:
            target_1 = round(price + 2.0 * atr, 2)
        if not target_2:
            target_2 = round(price + 4.0 * atr, 2)
        return {
            "ticker":   ticker,
            "profile":  profile,
            "analysis": analysis_text,
            "stop_loss": stop_loss,
            "target_1":  target_1,
            "target_2":  target_2,
        }


# ── Standalone async helpers (kept for backwards-compat) ─────────────────────

async def analyze_signals(scores, profile: str, api_key: str | None = None) -> str:
    key = api_key or os.getenv("ANTHROPIC_API_KEY", "")
    if not key or not HAS_ANTHROPIC:
        return _demo_analysis(scores, profile)
    client = anthropic.Anthropic(api_key=key)
    lines = [
        f"{s.ticker} | ${s.price:.2f} | {s.signal.upper()} | Score {s.total_score:.1f}"
        for s in scores
    ]
    prompt = f"Profil: {profile.upper()}\n\n" + "\n".join(lines) + "\n\nTop-Chance zusammenfassen."
    try:
        r = client.messages.create(model="claude-sonnet-4-6", max_tokens=600,
                                   system=SYSTEM_PROMPT,
                                   messages=[{"role": "user", "content": prompt}])
        return r.content[0].text
    except Exception as e:
        return f"API-Fehler: {e}\n\n{_demo_analysis(scores, profile)}"


def _demo_analysis(scores, profile: str) -> str:
    lines = [f"Trading-Analyse ({profile.upper()}) — Demo-Modus:\n"]
    for s in scores:
        mark = "LONG" if s.signal == "long" else "SHORT" if s.signal == "short" else "NEUTRAL"
        lines.append(f"{s.ticker}: {mark} | Score {s.total_score:+.1f}")
    return "\n".join(lines)
