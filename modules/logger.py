import json
import os
from datetime import datetime

LOG_FILE = "data/trading_log.json"

def log_result(result):
    os.makedirs("data", exist_ok=True)
    entry = {
        "timestamp": datetime.now().isoformat(),
        "coin": result.get("coin"),
        "signal": result.get("signal"),
        "price": result.get("price"),
        "change_24h": result.get("change_24h"),
        "comment": result.get("comment")
    }
    try:
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = []
        data.append(entry)
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Errore nel loggare risultato: {e}")
