"""Technical indicators as pure functions on pd.DataFrame."""
import pandas as pd
import numpy as np
from typing import Dict, Any


def rsi(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Relative Strength Index."""
    delta = df["close"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def macd(df: pd.DataFrame) -> pd.DataFrame:
    """MACD: returns DataFrame with macd, signal, hist."""
    ema12 = df["close"].ewm(span=12, adjust=False).mean()
    ema26 = df["close"].ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    hist = macd_line - signal_line
    return pd.DataFrame({"macd": macd_line, "signal": signal_line, "hist": hist}, index=df.index)


def ema(df: pd.DataFrame, period: int) -> pd.Series:
    """Exponential Moving Average."""
    return df["close"].ewm(span=period, adjust=False).mean()


def bollinger_bands(df: pd.DataFrame, period: int = 20) -> pd.DataFrame:
    """Bollinger Bands with %B and width."""
    mid = df["close"].rolling(period).mean()
    std = df["close"].rolling(period).std()
    upper = mid + 2 * std
    lower = mid - 2 * std
    pct_b = (df["close"] - lower) / (upper - lower).replace(0, np.nan)
    width = (upper - lower) / mid.replace(0, np.nan)
    return pd.DataFrame({
        "upper": upper,
        "mid": mid,
        "lower": lower,
        "pct_b": pct_b,
        "width": width,
    }, index=df.index)


def atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Average True Range."""
    high_low = df["high"] - df["low"]
    high_close = (df["high"] - df["close"].shift()).abs()
    low_close = (df["low"] - df["close"].shift()).abs()
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    return tr.ewm(com=period - 1, min_periods=period).mean()


def supertrend(df: pd.DataFrame, period: int = 10, multiplier: float = 3.0) -> pd.DataFrame:
    """Supertrend indicator. Returns DataFrame with supertrend and direction (1=bullish, -1=bearish)."""
    atr_vals = atr(df, period)
    hl2 = (df["high"] + df["low"]) / 2
    upper_band = hl2 + multiplier * atr_vals
    lower_band = hl2 - multiplier * atr_vals

    st = pd.Series(index=df.index, dtype=float)
    direction = pd.Series(index=df.index, dtype=int)

    for i in range(1, len(df)):
        # Upper band
        if upper_band.iloc[i] < upper_band.iloc[i - 1] or df["close"].iloc[i - 1] > upper_band.iloc[i - 1]:
            ub = upper_band.iloc[i]
        else:
            ub = upper_band.iloc[i - 1]

        # Lower band
        if lower_band.iloc[i] > lower_band.iloc[i - 1] or df["close"].iloc[i - 1] < lower_band.iloc[i - 1]:
            lb = lower_band.iloc[i]
        else:
            lb = lower_band.iloc[i - 1]

        upper_band.iloc[i] = ub
        lower_band.iloc[i] = lb

        prev_st = st.iloc[i - 1] if i > 1 else ub
        if pd.isna(prev_st):
            prev_st = ub

        if prev_st == upper_band.iloc[i - 1]:
            if df["close"].iloc[i] <= ub:
                st.iloc[i] = ub
                direction.iloc[i] = -1
            else:
                st.iloc[i] = lb
                direction.iloc[i] = 1
        else:
            if df["close"].iloc[i] >= lb:
                st.iloc[i] = lb
                direction.iloc[i] = 1
            else:
                st.iloc[i] = ub
                direction.iloc[i] = -1

    return pd.DataFrame({"supertrend": st, "direction": direction}, index=df.index)


def fibonacci_levels(df: pd.DataFrame) -> Dict[float, float]:
    """52-week Fibonacci retracement levels based on high/low."""
    high = df["high"].tail(252).max()
    low = df["low"].tail(252).min()
    diff = high - low
    return {
        0.0: low,
        0.236: low + 0.236 * diff,
        0.382: low + 0.382 * diff,
        0.5: low + 0.5 * diff,
        0.618: low + 0.618 * diff,
        0.786: low + 0.786 * diff,
        1.0: high,
    }


def adx(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """Average Directional Index with +DI and -DI."""
    high = df["high"]
    low = df["low"]
    close = df["close"]

    plus_dm = high.diff()
    minus_dm = -low.diff()
    plus_dm = plus_dm.where((plus_dm > minus_dm) & (plus_dm > 0), 0)
    minus_dm = minus_dm.where((minus_dm > plus_dm) & (minus_dm > 0), 0)

    tr = atr(df, period) * period  # smoothed TR
    smoothed_plus = plus_dm.ewm(com=period - 1, min_periods=period).mean()
    smoothed_minus = minus_dm.ewm(com=period - 1, min_periods=period).mean()
    atr_smooth = atr(df, period)

    plus_di = 100 * smoothed_plus / atr_smooth.replace(0, np.nan)
    minus_di = 100 * smoothed_minus / atr_smooth.replace(0, np.nan)

    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
    adx_line = dx.ewm(com=period - 1, min_periods=period).mean()

    return pd.DataFrame({
        "adx": adx_line,
        "plus_di": plus_di,
        "minus_di": minus_di,
    }, index=df.index)


def cci(df: pd.DataFrame, period: int = 20) -> pd.Series:
    """Commodity Channel Index."""
    tp = (df["high"] + df["low"] + df["close"]) / 3
    sma = tp.rolling(period).mean()
    mad = tp.rolling(period).apply(lambda x: np.abs(x - x.mean()).mean(), raw=True)
    return (tp - sma) / (0.015 * mad.replace(0, np.nan))


def obv(df: pd.DataFrame) -> pd.Series:
    """On-Balance Volume."""
    direction = np.sign(df["close"].diff()).fillna(0)
    return (direction * df["volume"]).cumsum()


def stochastic(df: pd.DataFrame, k_period: int = 14, d_period: int = 3) -> pd.DataFrame:
    """Stochastic Oscillator."""
    low_min = df["low"].rolling(k_period).min()
    high_max = df["high"].rolling(k_period).max()
    k = 100 * (df["close"] - low_min) / (high_max - low_min).replace(0, np.nan)
    d = k.rolling(d_period).mean()
    return pd.DataFrame({"k": k, "d": d}, index=df.index)


def compute_all(df: pd.DataFrame) -> Dict[str, Any]:
    """Compute all indicators and return latest values as dict."""
    if len(df) < 50:
        return {}

    try:
        rsi_vals = rsi(df)
        macd_vals = macd(df)
        ema20_vals = ema(df, 20)
        ema50_vals = ema(df, 50)
        ema200_vals = ema(df, 200)
        bb_vals = bollinger_bands(df)
        atr_vals = atr(df)
        st_vals = supertrend(df)
        fib_vals = fibonacci_levels(df)
        adx_vals = adx(df)
        cci_vals = cci(df)
        obv_vals = obv(df)
        stoch_vals = stochastic(df)

        current_price = float(df["close"].iloc[-1])
        obv_series = obv_vals.dropna()
        obv_trend = 1 if len(obv_series) > 5 and obv_series.iloc[-1] > obv_series.iloc[-5] else -1

        return {
            "price": current_price,
            "rsi": float(rsi_vals.iloc[-1]) if not pd.isna(rsi_vals.iloc[-1]) else 50.0,
            "macd": float(macd_vals["macd"].iloc[-1]) if not pd.isna(macd_vals["macd"].iloc[-1]) else 0.0,
            "macd_signal": float(macd_vals["signal"].iloc[-1]) if not pd.isna(macd_vals["signal"].iloc[-1]) else 0.0,
            "macd_hist": float(macd_vals["hist"].iloc[-1]) if not pd.isna(macd_vals["hist"].iloc[-1]) else 0.0,
            "ema20": float(ema20_vals.iloc[-1]) if not pd.isna(ema20_vals.iloc[-1]) else current_price,
            "ema50": float(ema50_vals.iloc[-1]) if not pd.isna(ema50_vals.iloc[-1]) else current_price,
            "ema200": float(ema200_vals.iloc[-1]) if not pd.isna(ema200_vals.iloc[-1]) else current_price,
            "bb_upper": float(bb_vals["upper"].iloc[-1]) if not pd.isna(bb_vals["upper"].iloc[-1]) else current_price * 1.02,
            "bb_mid": float(bb_vals["mid"].iloc[-1]) if not pd.isna(bb_vals["mid"].iloc[-1]) else current_price,
            "bb_lower": float(bb_vals["lower"].iloc[-1]) if not pd.isna(bb_vals["lower"].iloc[-1]) else current_price * 0.98,
            "bb_pct_b": float(bb_vals["pct_b"].iloc[-1]) if not pd.isna(bb_vals["pct_b"].iloc[-1]) else 0.5,
            "bb_width": float(bb_vals["width"].iloc[-1]) if not pd.isna(bb_vals["width"].iloc[-1]) else 0.05,
            "atr": float(atr_vals.iloc[-1]) if not pd.isna(atr_vals.iloc[-1]) else current_price * 0.02,
            "atr_pct": float(atr_vals.iloc[-1] / current_price * 100) if current_price > 0 and not pd.isna(atr_vals.iloc[-1]) else 2.0,
            "supertrend": float(st_vals["supertrend"].iloc[-1]) if not pd.isna(st_vals["supertrend"].iloc[-1]) else current_price,
            "supertrend_direction": int(st_vals["direction"].iloc[-1]) if not pd.isna(st_vals["direction"].iloc[-1]) else 0,
            "fibonacci": {str(k): float(v) for k, v in fib_vals.items()},
            "adx": float(adx_vals["adx"].iloc[-1]) if not pd.isna(adx_vals["adx"].iloc[-1]) else 20.0,
            "plus_di": float(adx_vals["plus_di"].iloc[-1]) if not pd.isna(adx_vals["plus_di"].iloc[-1]) else 25.0,
            "minus_di": float(adx_vals["minus_di"].iloc[-1]) if not pd.isna(adx_vals["minus_di"].iloc[-1]) else 25.0,
            "cci": float(cci_vals.iloc[-1]) if not pd.isna(cci_vals.iloc[-1]) else 0.0,
            "obv": float(obv_vals.iloc[-1]) if not pd.isna(obv_vals.iloc[-1]) else 0.0,
            "obv_trend": obv_trend,
            "stoch_k": float(stoch_vals["k"].iloc[-1]) if not pd.isna(stoch_vals["k"].iloc[-1]) else 50.0,
            "stoch_d": float(stoch_vals["d"].iloc[-1]) if not pd.isna(stoch_vals["d"].iloc[-1]) else 50.0,
        }
    except Exception as e:
        print(f"Error computing indicators: {e}")
        return {}
