import requests

def get_price_coin(coin_id, currency="eur"):
    """
    Ottiene dati di prezzo da CoinGecko per una specifica criptovaluta.
    """
    try:
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": coin_id,
            "vs_currencies": currency,
            "include_24hr_change": "true"
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if coin_id not in data:
            return {"coin": coin_id, "price": None, "change_24h": None, "meta": "Coin non trovata"}

        coin_data = data[coin_id]
        return {
            "coin": coin_id,
            "price": coin_data.get(currency),
            "change_24h": coin_data.get(f"{currency}_24h_change"),
            "meta": "Live data da CoinGecko"
        }
    except Exception as e:
        return {"coin": coin_id, "price": None, "change_24h": None, "meta": f"Errore: {str(e)}"}
