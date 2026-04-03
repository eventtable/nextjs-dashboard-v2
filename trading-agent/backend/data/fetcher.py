"""
backend/data/fetcher.py
Historische und Live-Kursdaten via yfinance.
Inkl. Krisenperioden-Definitionen seit 2001.
"""

from datetime import datetime, timedelta

import numpy as np
import pandas as pd

try:
    import yfinance as yf
    HAS_YFINANCE = True
except ImportError:
    HAS_YFINANCE = False


CRISIS_PERIODS = {
    "dotcom_crash":   {"name": "Dotcom-Crash",       "start": "2000-03-01", "end": "2002-10-09", "type": "bear", "drawdown": -0.78, "desc": "Platzen der Tech-Blase. NASDAQ -78%."},
    "gfc_2008":       {"name": "Finanzkrise 2008",    "start": "2007-10-09", "end": "2009-03-09", "type": "bear", "drawdown": -0.57, "desc": "Subprime-Kollaps. S&P500 -57%."},
    "recovery_2009":  {"name": "Erholung 2009",       "start": "2009-03-09", "end": "2010-04-26", "type": "bull", "drawdown": +0.65, "desc": "Stärkstes Erholungsjahr nach GFC."},
    "euro_crisis":    {"name": "Euro-Krise",          "start": "2011-07-01", "end": "2012-06-01", "type": "bear", "drawdown": -0.22, "desc": "Staatschulden Europa."},
    "china_2015":     {"name": "China-Crash 2015",    "start": "2015-06-12", "end": "2016-02-11", "type": "bear", "drawdown": -0.33, "desc": "Chinesische Blase platzt."},
    "covid_crash":    {"name": "COVID-Crash 2020",    "start": "2020-02-19", "end": "2020-03-23", "type": "bear", "drawdown": -0.34, "desc": "Schnellster Crash der Geschichte."},
    "covid_recovery": {"name": "V-Recovery 2020",     "start": "2020-03-23", "end": "2020-12-31", "type": "bull", "drawdown": +0.60, "desc": "Schnellste Erholung je."},
    "rate_shock_2022": {"name": "Zinsschock 2022",    "start": "2022-01-03", "end": "2022-10-13", "type": "bear", "drawdown": -0.27, "desc": "Fed hebt aggressiv an."},
}

# Alias used by main.py
CRISIS_EPISODES = CRISIS_PERIODS


def fetch_ohlcv(ticker: str, period: str = "2y", interval: str = "1d",
                start: str | None = None, end: str | None = None) -> pd.DataFrame:
    """Fetch OHLCV data as a pandas DataFrame with lowercase column names."""
    if HAS_YFINANCE:
        try:
            t = yf.Ticker(ticker)
            if start:
                df = t.history(
                    start=start,
                    end=end or datetime.today().strftime("%Y-%m-%d"),
                    interval=interval,
                )
            else:
                df = t.history(period=period, interval=interval)
            if not df.empty:
                df = df.rename(columns={
                    "Open": "open", "High": "high",
                    "Low": "low", "Close": "close", "Volume": "volume",
                })
                return df[["open", "high", "low", "close", "volume"]]
        except Exception as e:
            print(f"[fetcher] {ticker}: {e}")

    return _synthetic_df(ticker, 500)


def fetch_multiple(tickers: list, period: str = "1y") -> dict:
    """Fetch OHLCV data for multiple tickers. Returns {ticker: pd.DataFrame}."""
    return {ticker: fetch_ohlcv(ticker, period=period) for ticker in tickers}


def fetch_crisis_data(ticker: str, crisis_id: str) -> pd.DataFrame:
    crisis = CRISIS_PERIODS.get(crisis_id)
    if not crisis:
        return pd.DataFrame()
    return fetch_ohlcv(ticker, start=crisis["start"], end=crisis["end"])


def fetch_full_history(ticker: str) -> pd.DataFrame:
    return fetch_ohlcv(ticker, start="2001-01-01")


def _synthetic_df(ticker: str, n: int = 500) -> pd.DataFrame:
    seed = sum(ord(c) for c in ticker)
    rng = np.random.default_rng(seed)
    prices = [100.0]
    for _ in range(n - 1):
        prices.append(max(5.0, prices[-1] * (1 + rng.normal(0.0003, 0.012))))
    close  = np.array(prices)
    high   = close * (1 + rng.uniform(0.001, 0.008, n))
    low    = close * (1 - rng.uniform(0.001, 0.008, n))
    open_  = np.roll(close, 1); open_[0] = close[0]
    volume = rng.integers(500_000, 5_000_000, n).astype(float)
    dates  = pd.date_range(start="2023-01-01", periods=n, freq="D")
    return pd.DataFrame(
        {"open": open_, "high": high, "low": low, "close": close, "volume": volume},
        index=dates,
    )
