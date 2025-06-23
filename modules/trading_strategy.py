def simple_sma_strategy(prices, short_window=5, long_window=20):
    if len(prices) < long_window: return "hold", {}
    sma_short = sum(prices[-short_window:]) / short_window
    sma_long = sum(prices[-long_window:]) / long_window

    if sma_short > sma_long:
        return "buy", {"sma_short": sma_short, "sma_long": sma_long}
    elif sma_short < sma_long:
        return "sell", {"sma_short": sma_short, "sma_long": sma_long}
    else:
        return "hold", {"sma_short": sma_short, "sma_long": sma_long}
