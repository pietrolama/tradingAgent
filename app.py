from flask import Flask, request, jsonify
from threading import Thread, Event
import time
from datetime import datetime
from modules.trading_agent import analyze_coin
from modules.logger import log_result

app = Flask(__name__)  # <- DEFINISCI L’ISTANZA QUI PRIMA DEGLI ENDPOINT

scheduler_thread = None
stop_event = Event()

def scheduler_loop(coin_id, interval_minutes, stop_event):
    print(f"🕒 Scheduler partito per {coin_id.upper()} ogni {interval_minutes} minuti")
    while not stop_event.is_set():
        result = analyze_coin(coin_id)
        print(f"[{datetime.now().isoformat()}] Segnale: {result['signal'].upper()} Prezzo: {result['price']} USD")
        log_result(result)
        stop_event.wait(interval_minutes * 60)
    print("Scheduler fermato")

@app.route('/api/scheduler/start', methods=['POST'])
def start_scheduler():
    global scheduler_thread, stop_event
    if scheduler_thread and scheduler_thread.is_alive():
        return jsonify({"status": "running"}), 400

    data = request.get_json()
    coin = data.get("coin", "bitcoin")
    interval = data.get("interval", 5)

    stop_event.clear()
    scheduler_thread = Thread(target=scheduler_loop, args=(coin, interval, stop_event))
    scheduler_thread.daemon = True
    scheduler_thread.start()

    return jsonify({"status": "started", "coin": coin, "interval_minutes": interval})

@app.route('/api/scheduler/stop', methods=['POST'])
def stop_scheduler():
    global stop_event
    stop_event.set()
    return jsonify({"status": "stopped"})

if __name__ == "__main__":
    app.run(debug=True)
