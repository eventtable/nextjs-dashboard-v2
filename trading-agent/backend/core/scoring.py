"""
backend/core/scoring.py
Drei Bewertungsprofile: Momentum, Swing, Position.
Jeder Score ist ein float von -10 bis +10.
"""

from dataclasses import dataclass, field
from typing import Literal
from .indicators import IndicatorResult

Profile = Literal["momentum", "swing", "position"]

SIGNAL_LABELS = {
    "long":  "LONG",
    "short": "SHORT",
    "hold":  "HALTEN",
    "watch": "BEOBACHTEN",
}


@dataclass
class HorizonScore:
    momentum: float   # 1–5 Tage
    swing: float      # 1–8 Wochen
    position: float   # 3–12 Monate


@dataclass
class StockScore:
    ticker: str
    price: float
    signal: str                        # long | short | hold | watch
    total_score: float
    horizons: HorizonScore
    ind: IndicatorResult
    reasons: list[str] = field(default_factory=list)
    stop_loss: float = 0.0
    target_1: float = 0.0
    target_2: float = 0.0


def _momentum_score(ind: IndicatorResult, weights: dict) -> tuple[float, list[str]]:
    """Momentum-Score: RSI, MACD, Volumen, BB, 52W-Nähe"""
    s, reasons = 0.0, []

    if ind.rsi < 25:
        s += 3.0 * weights.get("rsi", 0.20); reasons.append(f"RSI {ind.rsi:.1f} — stark überverkauft")
    elif ind.rsi < 35:
        s += 1.5 * weights.get("rsi", 0.20); reasons.append(f"RSI {ind.rsi:.1f} — überverkauft")
    elif ind.rsi > 75:
        s -= 3.0 * weights.get("rsi", 0.20); reasons.append(f"RSI {ind.rsi:.1f} — stark überkauft")
    elif ind.rsi > 65:
        s -= 1.5 * weights.get("rsi", 0.20); reasons.append(f"RSI {ind.rsi:.1f} — überkauft")

    if ind.macd_hist > 0:
        s += 2.0 * weights.get("macd", 0.15); reasons.append("MACD Histogramm positiv")
    else:
        s -= 2.0 * weights.get("macd", 0.15); reasons.append("MACD Histogramm negativ")

    if ind.volume_ratio > 2.5:
        s += 2.0 * weights.get("volume", 0.10); reasons.append(f"Volumen-Spike {ind.volume_ratio:.1f}x")
    elif ind.volume_ratio > 1.5:
        s += 1.0 * weights.get("volume", 0.10)

    if ind.bb_pct < 0.10:
        s += 2.0 * weights.get("bb", 0.08); reasons.append("Am unteren Bollinger Band")
    elif ind.bb_pct > 0.90:
        s -= 2.0 * weights.get("bb", 0.08); reasons.append("Am oberen Bollinger Band")

    if ind.dist_52l < 0.02:
        s += 2.5 * weights.get("rsi", 0.20); reasons.append("Nahe 52-Wochen-Tief — Bounce-Zone")
    if ind.dist_52h < 0.01:
        s += 2.0 * weights.get("ema", 0.20); reasons.append("Ausbruch über 52W-Hoch!")

    if ind.stoch_k < 20:
        s += 1.5 * weights.get("rsi", 0.20); reasons.append(f"Stochastik {ind.stoch_k:.0f} — überverkauft")
    elif ind.stoch_k > 80:
        s -= 1.5 * weights.get("rsi", 0.20)

    return round(s * 5, 2), reasons


def _swing_score(ind: IndicatorResult, weights: dict) -> tuple[float, list[str]]:
    """Swing-Score: EMA-Crossover, Fibonacci, Supertrend, ATR-Zone"""
    s, reasons = 0.0, []

    if ind.ema9 > ind.ema21:
        s += 2.0 * weights.get("ema", 0.20); reasons.append("EMA9 > EMA21 — bullisch")
    else:
        s -= 2.0 * weights.get("ema", 0.20); reasons.append("EMA9 < EMA21 — bärisch")

    if ind.ema21 > ind.ema50:
        s += 1.0 * weights.get("ema", 0.20)

    if ind.supertrend_above:
        s += 2.0 * weights.get("supertrend", 0.15)

    if ind.fib_dist < 0.015:
        fib_bonus = 2.0 if ind.fib_level >= 0.5 else 1.2
        s += fib_bonus * weights.get("fib", 0.12)
        reasons.append(f"Nahe Fibonacci {ind.fib_level*100:.0f}%")

    if 40 < ind.rsi < 60:
        s += 1.0 * weights.get("rsi", 0.20); reasons.append("RSI in neutraler Zone — Aufholpotenzial")

    if ind.dist_52h < 0.05:
        s += 1.5 * weights.get("ema", 0.20); reasons.append("Kurs nahe 52W-Hoch — Stärke")

    if ind.cci < -100:
        s += 1.5 * weights.get("rsi", 0.20); reasons.append(f"CCI {ind.cci:.0f} — überverkauft")
    elif ind.cci > 100:
        s -= 1.5 * weights.get("rsi", 0.20)

    return round(s * 4, 2), reasons


def _position_score(ind: IndicatorResult, weights: dict) -> tuple[float, list[str]]:
    """Position-Score: EMA200, Langfrist-Trend, Makro"""
    s, reasons = 0.0, []

    if ind.supertrend_above and ind.ema50 > ind.ema200:
        s += 4.0 * weights.get("ema", 0.20); reasons.append("Über EMA200 — Langfristtrend bullisch")
    elif not ind.supertrend_above and ind.ema50 < ind.ema200:
        s -= 4.0 * weights.get("ema", 0.20); reasons.append("Unter EMA200 — Langfristtrend bärisch")
    elif ind.ema50 > ind.ema200:
        s += 2.0 * weights.get("ema", 0.20)

    if ind.ema50 > ind.ema200:
        s += 2.0 * weights.get("supertrend", 0.15); reasons.append("EMA50 > EMA200 — Golden Cross Zone")
    else:
        s -= 1.5 * weights.get("supertrend", 0.15)

    if ind.adx > 30:
        s += 1.5 * weights.get("ema", 0.20); reasons.append(f"ADX {ind.adx:.0f} — starker Trend")
    elif ind.adx < 20:
        s -= 0.5 * weights.get("ema", 0.20); reasons.append("ADX niedrig — kein klarer Trend")

    if ind.macd > 0:
        s += 1.0 * weights.get("macd", 0.15)

    return round(s * 3, 2), reasons


def score_stock(
    ticker: str,
    price: float,
    ind: IndicatorResult,
    profile: Profile,
    weights: dict,
) -> StockScore:
    mom_score, mom_reasons = _momentum_score(ind, weights)
    swg_score, swg_reasons = _swing_score(ind, weights)
    pos_score, pos_reasons = _position_score(ind, weights)

    profile_scores = {"momentum": mom_score, "swing": swg_score, "position": pos_score}
    total = profile_scores[profile]
    reasons = {"momentum": mom_reasons, "swing": swg_reasons, "position": pos_reasons}[profile]

    if total > 4.0:    signal = "long"
    elif total < -4.0: signal = "short"
    elif abs(total) < 1.5: signal = "hold"
    else:              signal = "watch"

    atr = ind.atr or price * 0.01
    if signal in ("long", "watch"):
        stop_loss = round(price - 1.5 * atr, 2)
        target_1  = round(price + 2.0 * atr, 2)
        target_2  = round(price + 4.0 * atr, 2)
    else:
        stop_loss = round(price + 1.5 * atr, 2)
        target_1  = round(price - 2.0 * atr, 2)
        target_2  = round(price - 4.0 * atr, 2)

    return StockScore(
        ticker=ticker, price=price, signal=signal, total_score=total,
        horizons=HorizonScore(momentum=mom_score, swing=swg_score, position=pos_score),
        ind=ind, reasons=reasons, stop_loss=stop_loss, target_1=target_1, target_2=target_2,
    )


PROFILES = {"momentum": _momentum_score, "swing": _swing_score, "position": _position_score}


def get_signal(score: float) -> str:
    if score > 6:  return "STRONG_BUY"
    if score > 3:  return "BUY"
    if score < -6: return "STRONG_SELL"
    if score < -3: return "SELL"
    return "NEUTRAL"


def get_recommendation(score: float, profile: str, indicators: dict) -> dict:
    return {"signal": get_signal(score), "score": score, "profile": profile, "reasons": []}
