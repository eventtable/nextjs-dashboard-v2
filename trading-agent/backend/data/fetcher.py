"""yfinance data fetcher with crisis episodes."""
import yfinance as yf
import pandas as pd
from datetime import datetime
from typing import Optional

CRISIS_EPISODES = {
    "dot_com": {
        "id": "dot_com",
        "name": "Dot-Com Crash",
        "start": "2000-03-01",
        "end": "2002-10-09",
        "description": "Platzen der Technologieblase, NASDAQ verlor ~78%",
        "severity": "extreme",
    },
    "financial_crisis": {
        "id": "financial_crisis",
        "name": "Finanzkrise 2008",
        "start": "2007-10-09",
        "end": "2009-03-09",
        "description": "Subprime-Krise, Lehman Brothers Insolvenz, globale Rezession",
        "severity": "extreme",
    },
    "flash_crash": {
        "id": "flash_crash",
        "name": "Flash Crash 2010",
        "start": "2010-05-06",
        "end": "2010-07-02",
        "description": "Blitzcrash im US-Aktienmarkt, Dow Jones fiel 1000 Punkte in Minuten",
        "severity": "high",
    },
    "euro_debt": {
        "id": "euro_debt",
        "name": "Eurokrise",
        "start": "2011-07-22",
        "end": "2011-10-04",
        "description": "Europäische Schuldenkrise, Griechenland-Rettungspaket",
        "severity": "high",
    },
    "oil_crash": {
        "id": "oil_crash",
        "name": "Ölpreiscrash",
        "start": "2014-06-20",
        "end": "2016-02-11",
        "description": "Ölpreis fiel von $115 auf unter $30, Energiesektor unter Druck",
        "severity": "medium",
    },
    "covid": {
        "id": "covid",
        "name": "COVID-19 Crash",
        "start": "2020-02-19",
        "end": "2020-03-23",
        "description": "Pandemiebedingter Markteinbruch, schnellster Bärenmarkt der Geschichte",
        "severity": "extreme",
    },
    "inflation_shock": {
        "id": "inflation_shock",
        "name": "Inflationsschock",
        "start": "2022-01-03",
        "end": "2022-10-13",
        "description": "Aggressive Zinserhöhungen der Fed, Technologiewerte stark betroffen",
        "severity": "high",
    },
    "svb_crisis": {
        "id": "svb_crisis",
        "name": "SVB-Bankenkrise",
        "start": "2023-03-08",
        "end": "2023-03-17",
        "description": "Zusammenbruch der Silicon Valley Bank, Bankensektor unter Druck",
        "severity": "medium",
    },
}


def fetch_ohlcv(
    ticker: str,
    period: str = "1y",
    interval: str = "1d",
    start: Optional[str] = None,
    end: Optional[str] = None,
) -> pd.DataFrame:
    """Fetch OHLCV data for a single ticker via yfinance."""
    try:
        t = yf.Ticker(ticker)
        if start and end:
            df = t.history(start=start, end=end, interval=interval)
        else:
            df = t.history(period=period, interval=interval)

        if df.empty:
            return pd.DataFrame()

        # Normalize column names
        df = df.rename(
            columns={
                "Open": "open",
                "High": "high",
                "Low": "low",
                "Close": "close",
                "Volume": "volume",
            }
        )
        # Keep only OHLCV
        cols = [c for c in ["open", "high", "low", "close", "volume"] if c in df.columns]
        df = df[cols].copy()
        df.index = pd.to_datetime(df.index)
        df = df.dropna()
        return df
    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        return pd.DataFrame()


def fetch_multiple(
    tickers: list,
    period: str = "6mo",
    interval: str = "1d",
) -> dict:
    """Fetch OHLCV data for multiple tickers. Returns dict of DataFrames."""
    result = {}
    for ticker in tickers:
        df = fetch_ohlcv(ticker, period=period, interval=interval)
        if not df.empty:
            result[ticker] = df
    return result
