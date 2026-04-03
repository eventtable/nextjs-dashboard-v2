"""
backend/core/agent.py
Selbstlernender Trading-Agent.
— Paper-Trading Loop
— Reinforcement Learning auf Indikator-Gewichten
— Persistente State-Speicherung
"""

import json
import os
import time
import random
from dataclasses import dataclass, asdict, field
from typing import Literal
from pathlib import Path

STATE_FILE = Path(__file__).parent.parent / "agent_state.json"

Profile = Literal["momentum", "swing", "position"]

DEFAULT_WEIGHTS = {
    "rsi":        0.20,
    "macd":       0.15,
    "ema":        0.20,
    "supertrend": 0.15,
    "fib":        0.12,
    "volume":     0.10,
    "bb":         0.08,
}

PROFILE_WEIGHTS: dict[str, dict] = {
    "momentum": {"rsi":0.30,"macd":0.25,"volume":0.20,"bb":0.10,"ema":0.08,"supertrend":0.05,"fib":0.02},
    "swing":    {"ema":0.25,"fib":0.22,"supertrend":0.20,"rsi":0.15,"macd":0.10,"bb":0.05,"volume":0.03},
    "position": {"ema":0.30,"supertrend":0.25,"fib":0.18,"macd":0.12,"rsi":0.08,"volume":0.05,"bb":0.02},
}


@dataclass
class Trade:
    id: str
    ticker: str
    direction: str      # long | short
    entry_price: float
    exit_price: float
    pnl_pct: float
    profit: bool
    profile: Profile
    strategy_used: str
    timestamp: float
    crisis_epoch: str = ""


@dataclass
class AgentState:
    capital: float = 100_000.0
    weights: dict = field(default_factory=lambda: dict(DEFAULT_WEIGHTS))
    profile_weights: dict = field(default_factory=lambda: {k: dict(v) for k, v in PROFILE_WEIGHTS.items()})
    trades: list = field(default_factory=list)
    win_history: list = field(default_factory=list)
    total_pnl: float = 0.0
    learning_rate: float = 0.015
    version: int = 1


class TradingAgent:
    def __init__(self):
        self.state = self._load_state()

    def _load_state(self) -> AgentState:
        if STATE_FILE.exists():
            try:
                data = json.loads(STATE_FILE.read_text())
                s = AgentState()
                s.__dict__.update(data)
                return s
            except Exception:
                pass
        return AgentState()

    def save_state(self):
        STATE_FILE.write_text(json.dumps(asdict(self.state), indent=2))

    def reset(self):
        self.state = AgentState()
        self.save_state()

    def record_trade(
        self,
        ticker: str,
        direction: str,
        entry: float,
        exit_price: float,
        profile: Profile,
        crisis_epoch: str = "",
    ) -> Trade:
        pnl_pct = (
            (exit_price - entry) / entry
            if direction == "long"
            else (entry - exit_price) / entry
        )
        profit = pnl_pct > 0
        trade = Trade(
            id=f"{ticker}_{int(time.time()*1000)}",
            ticker=ticker,
            direction=direction,
            entry_price=round(entry, 4),
            exit_price=round(exit_price, 4),
            pnl_pct=round(pnl_pct, 6),
            profit=profit,
            profile=profile,
            strategy_used=f"{profile}_v{self.state.version}",
            timestamp=time.time(),
            crisis_epoch=crisis_epoch,
        )
        self.state.trades.append(asdict(trade))
        self.state.total_pnl += pnl_pct * 1000
        self.state.capital += pnl_pct * 1000

        self._learn_from_trade(trade)
        self._update_win_history()
        return trade

    def _learn_from_trade(self, trade: Trade):
        lr = self.state.learning_rate
        w = self.state.weights
        profile = trade.profile

        if trade.profit:
            if profile == "momentum":
                w["rsi"]    = min(0.5, w["rsi"]    + lr)
                w["macd"]   = min(0.4, w["macd"]   + lr * 0.8)
                w["volume"] = min(0.3, w["volume"]  + lr * 0.5)
            elif profile == "swing":
                w["ema"]        = min(0.5, w["ema"]        + lr)
                w["fib"]        = min(0.4, w["fib"]        + lr * 0.8)
                w["supertrend"] = min(0.4, w["supertrend"] + lr * 0.6)
            else:
                w["ema"]        = min(0.55, w["ema"]        + lr * 1.2)
                w["supertrend"] = min(0.4,  w["supertrend"] + lr * 0.8)
        else:
            sorted_keys = sorted(w.keys(), key=lambda k: w[k])
            weakest = sorted_keys[0]
            w[weakest] = max(0.01, w[weakest] - lr)
            w[sorted_keys[-1]] = min(0.55, w[sorted_keys[-1]] + lr * 0.3)

        self._normalize_weights()
        self.state.profile_weights[profile] = dict(self.state.weights)

    def _normalize_weights(self):
        w = self.state.weights
        total = sum(w.values())
        if total > 0:
            for k in w:
                w[k] = round(w[k] / total, 4)

    def _update_win_history(self):
        last = self.state.trades[-20:]
        wins = sum(1 for t in last if t.get("profit"))
        wr = wins / len(last) * 100 if last else 0
        self.state.win_history.append(round(wr, 1))
        if len(self.state.win_history) > 500:
            self.state.win_history = self.state.win_history[-500:]

    @property
    def stats(self) -> dict:
        t = self.state.trades
        if not t:
            return {"total": 0, "wins": 0, "losses": 0, "win_rate": 0.0,
                    "avg_win": 0.0, "avg_loss": 0.0, "best": 0.0, "worst": 0.0,
                    "total_pnl": 0.0, "capital": self.state.capital}
        wins   = [x for x in t if x.get("profit")]
        losses = [x for x in t if not x.get("profit")]
        pnls   = [x["pnl_pct"] * 100 for x in t]
        return {
            "total":    len(t),
            "wins":     len(wins),
            "losses":   len(losses),
            "win_rate": round(len(wins) / len(t) * 100, 2),
            "avg_win":  round(sum(x["pnl_pct"] for x in wins)  / max(len(wins), 1) * 100, 3),
            "avg_loss": round(sum(x["pnl_pct"] for x in losses)/ max(len(losses),1)* 100, 3),
            "best":     round(max(pnls), 3),
            "worst":    round(min(pnls), 3),
            "total_pnl": round(self.state.total_pnl, 2),
            "capital":  round(self.state.capital, 2),
            "profile_breakdown": self._profile_stats(t),
        }

    def _profile_stats(self, trades) -> dict:
        result = {}
        for profile in ("momentum", "swing", "position"):
            pt = [t for t in trades if t.get("profile") == profile]
            if not pt:
                continue
            wins = sum(1 for t in pt if t.get("profit"))
            result[profile] = {"trades": len(pt), "win_rate": round(wins / len(pt) * 100, 1)}
        return result

    def get_weights(self) -> dict:
        return dict(self.state.weights)

    def get_win_history(self) -> list:
        return list(self.state.win_history)

    def get_recent_trades(self, n: int = 20) -> list:
        return self.state.trades[-n:][::-1]


_agent: TradingAgent | None = None

def get_agent() -> TradingAgent:
    global _agent
    if _agent is None:
        _agent = TradingAgent()
    return _agent
