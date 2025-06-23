from modules.trading_agent import analyze_coin
from datetime import datetime
from modules.logger import log_result

class TradingSimulator:
    def __init__(self, coin_id, budget):
        self.coin_id = coin_id
        self.budget = budget
        self.prezzo_acquisto = None
        self.asset_qty = 0.0
        self.cash = budget
        self.history = []
        self.started = False

    def start(self):
        if self.started:
            return {
                "status": "already_started",
                "asset_qty": self.asset_qty,
                "cash": self.cash,
                "history": self.history,
            }

        info = analyze_coin(self.coin_id, 0, 0)
        self.prezzo_acquisto = info.get("price")

        if self.prezzo_acquisto:
            self.asset_qty = self.cash / self.prezzo_acquisto
            self.cash = 0.0
            self.history.append(
                {
                    "timestamp": datetime.now().isoformat(),
                    "action": "buy",
                    "price": self.prezzo_acquisto,
                    "cash": self.cash,
                    "asset_qty": self.asset_qty,
                    "total_value": self.asset_qty * self.prezzo_acquisto,
                    "profit": 0.0,
                }
            )
            self.started = True

        return {
            "status": "started",
            "asset_qty": self.asset_qty,
            "cash": self.cash,
            "history": self.history,
        }

    def simulate_step(self):
        if not self.started:
            return None

        result = analyze_coin(self.coin_id, self.prezzo_acquisto, self.budget)
        log_result(result)
        prezzo_attuale = result.get('price')
        segnale = result.get('signal')
        total_value = self.asset_qty * prezzo_attuale + self.cash
        profit = total_value - self.budget

        if segnale == "buy" and self.cash > 0:
            qty = self.cash / prezzo_attuale
            self.asset_qty += qty
            self.cash = 0.0
            self.history.append({
                "timestamp": datetime.now().isoformat(),
                "action": "buy",
                "price": prezzo_attuale,
                "cash": self.cash,
                "asset_qty": self.asset_qty,
                "total_value": total_value,
                "profit": profit
            })
        elif segnale == "sell" and self.asset_qty > 0:
            self.cash += self.asset_qty * prezzo_attuale
            self.asset_qty = 0.0
            self.history.append({
                "timestamp": datetime.now().isoformat(),
                "action": "sell",
                "price": prezzo_attuale,
                "cash": self.cash,
                "asset_qty": self.asset_qty,
                "total_value": self.cash,
                "profit": profit
            })
        # hold non fa nulla

        return {
            "price": prezzo_attuale,
            "signal": segnale,
            "total_value": total_value,
            "profit": profit,
            "cash": self.cash,
            "asset_qty": self.asset_qty,
            "history": self.history,
        }
