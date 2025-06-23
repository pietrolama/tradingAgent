# modules/scheduler.py

import time
import json
import os
from datetime import datetime
from modules.trading_agent import analyze_coin
from modules.trading_simulator import TradingSimulator

simulator = TradingSimulator(budget_eur=500)

LOG_FILE = "data/trading_log.json"

def log_result(result):
    """
    Salva l'analisi nel file di log JSON.
    """
    if not os.path.exists("data"):
        os.makedirs("data")

    log = []
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                log = json.load(f)
        except Exception:
            log = []

    result["timestamp"] = datetime.now().isoformat()
    log.append(result)

    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2, ensure_ascii=False)

def run_scheduler(coin_id="bitcoin", interval_minutes=5):
    print(f"🕒 Scheduler attivo ogni {interval_minutes} minuti per {coin_id.upper()}...\n")
    while True:
        print(f"🔄 Analisi in corso per {coin_id}...")
        result = analyze_coin(coin_id)
        print(f"[{datetime.now().isoformat()}] 💡 Decisione: {result['signal'].upper()} | Prezzo: {result['price']} USD | Δ24h: {round(result['change_24h'], 2)}%")
        log_result(result)
        time.sleep(interval_minutes * 60)
