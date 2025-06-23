from modules.market_data import get_price_coin

def analyze_coin(coin_id, prezzo_acquisto, investimento, currency="eur"):
    """
    Analizza la moneta e fornisce suggerimenti.
    Se prezzo_acquisto è 0 o None, lo imposta al prezzo attuale.
    """
    info = get_price_coin(coin_id, currency)
    prezzo_attuale = info["price"]

    if prezzo_attuale is None:
        return {
            "coin": coin_id,
            "price": None,
            "change_24h": None,
            "signal": "unknown",
            "comment": "Impossibile recuperare prezzo attuale.",
            "current_value": None,
            "profit_loss": None,
            "meta": info["meta"]
        }

    # Se prezzo_acquisto non valido, usa prezzo_attuale come prezzo d'acquisto
    if not prezzo_acquisto or prezzo_acquisto == 0:
        prezzo_acquisto = prezzo_attuale

    segnale = "hold"
    commento = "Osservazione consigliata. Attendere segnali più chiari."

    change = info["change_24h"]

    if change is not None:
        if change < -2:
            segnale = "buy"
            commento = "Forte calo: possibile occasione di acquisto."
        elif change > 2:
            segnale = "sell"
            commento = "Forte crescita: possibile momento per vendere."

    profitto_stimato = None
    if prezzo_acquisto and investimento:
        valore_attuale = (investimento / prezzo_acquisto) * prezzo_attuale
        profitto_stimato = round(valore_attuale - investimento, 2)

    return {
        "coin": coin_id,
        "price": prezzo_attuale,
        "change_24h": round(change, 2) if change else None,
        "signal": segnale,
        "comment": commento,
        "current_value": round(valore_attuale, 2) if prezzo_acquisto and investimento else None,
        "profit_loss": profitto_stimato,
        "meta": info["meta"]
    }
