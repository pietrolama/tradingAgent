let priceChart;
let countdown = 300;
let countdownInterval;
let initialBuyPrice = null;
let currentInvestment = null;
let currentCoin = null;

window.addEventListener("DOMContentLoaded", () => {
  const ctx = document.getElementById("portfolioChart").getContext("2d");

  function initChart(labels = [], data = []) {
    priceChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Prezzo (€)",
          data: data,
          borderColor: "#00ff9c",
          backgroundColor: "rgba(0, 255, 156, 0.2)",
          tension: 0.3,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        scales: {
          x: { ticks: { color: "#ccc" } },
          y: { ticks: { color: "#ccc" } }
        }
      }
    });
  }

  async function fetchPriceHistory(coin) {
    const now = new Date();
    const labels = [];
    const data = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      labels.push(d.getHours() + ":00");
      data.push(28000 + Math.sin(i) * 100 + Math.random() * 100);
    }
    return { labels, data };
  }

  async function analyzeNow() {
    if (!initialBuyPrice || !currentInvestment || !currentCoin) {
      updateStatus("Simulazione non avviata correttamente.");
      return;
    }

    try {
      const res = await fetch("/api/coin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coin_id: currentCoin,
          prezzo_acquisto: initialBuyPrice,
          investimento: currentInvestment
        })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();

      let coinName = (typeof data.coin === "string") ? data.coin : JSON.stringify(data.coin);
      coinName = coinName.toUpperCase();

      const price = (typeof data.price === "number") ? data.price.toFixed(2) : "N/A";
      const change24h = (typeof data.change_24h === "number") ? data.change_24h.toFixed(2) : "N/A";
      const signal = (typeof data.signal === "string") ? data.signal.toUpperCase() : "N/A";
      const signalColor = data.signal === "buy" ? "green" : data.signal === "sell" ? "red" : "#ccc";
      const comment = data.comment || "";
      const currentValue = (typeof data.current_value === "number") ? data.current_value.toFixed(2) : "N/A";
      const profitLoss = (typeof data.profit_loss === "number") ? data.profit_loss.toFixed(2) : "N/A";

      document.getElementById("result").innerHTML = `
        <p><strong>${coinName}</strong> — Prezzo attuale: €${price}</p>
        <p>Variazione 24h: ${change24h}%</p>
        <p>Segnale: <span style="color: ${signalColor}">${signal}</span></p>
        <p>${comment}</p>
        <p>Valore attuale investimento: €${currentValue}</p>
        <p>Profitto stimato: €${profitLoss}</p>
      `;

      // Aggiorna grafico
      const history = await fetchPriceHistory(currentCoin);
      if (priceChart) {
        priceChart.data.labels = history.labels;
        priceChart.data.datasets[0].data = history.data;
        priceChart.update();
      } else {
        initChart(history.labels, history.data);
      }

      // Aggiorna dati di status
      updateStatus(`Ultima analisi: segnale ${signal}, prezzo €${price}`);

    } catch (error) {
      console.error("Errore nell'analisi:", error);
      updateStatus("Errore nel recupero dati. Riprova più tardi.");
    }
  }

  function updateStatus(text) {
    const statusEl = document.getElementById("status");
    if (statusEl) {
      statusEl.querySelector("#cash").textContent = currentInvestment ? currentInvestment.toFixed(2) : "-";
      // Qui puoi aggiungere altre info aggiornate come asset, profitto ecc.
      statusEl.querySelector("#profit").textContent = "-"; // da calcolare se vuoi
    }

    const timerEl = document.getElementById("timer");
    if (timerEl) {
      timerEl.textContent = text;
    }
  }

  async function startSimulation() {
    const investment = parseFloat(document.getElementById("investment").value);
    const coin = document.getElementById("coin").value;
    const intervalMinutes = parseFloat(document.getElementById("interval").value);

    if (isNaN(investment) || investment <= 0) {
      alert("Inserisci un investimento valido.");
      return;
    }

    if (isNaN(intervalMinutes) || intervalMinutes <= 0) {
      alert("Intervallo non valido.");
      return;
    }

    try {
      // Prendo il prezzo di mercato attuale per il buy iniziale
      const res = await fetch("/api/coin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin_id: coin, prezzo_acquisto: 0, investimento: investment })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      initialBuyPrice = data.price;
      currentInvestment = investment;
      currentCoin = coin;

      if (!initialBuyPrice) {
        alert("Impossibile recuperare il prezzo di acquisto.");
        return;
      }

      updateStatus("Simulazione avviata con prezzo di acquisto: €" + initialBuyPrice.toFixed(2));
      analyzeNow(); // Primo ciclo subito

      if (countdownInterval) clearInterval(countdownInterval);
      countdown = Math.round(intervalMinutes * 60);
      countdownInterval = setInterval(() => {
        countdown--;
        document.getElementById("timer").textContent = `Prossima analisi in ${countdown} secondi`;
        if (countdown <= 0) {
          analyzeNow();
          countdown = Math.round(intervalMinutes * 60);
        }
      }, 1000);
    } catch (error) {
      alert("Errore nel recupero prezzo iniziale: " + error.message);
    }
  }

  function resetSimulation() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
    const intervalMinutes = parseFloat(document.getElementById("interval").value);
    countdown = Math.round((isNaN(intervalMinutes) || intervalMinutes <= 0 ? 5 : intervalMinutes) * 60);

    initialBuyPrice = null;
    currentInvestment = null;
    currentCoin = null;

    document.getElementById("timer").textContent = "";
    document.getElementById("result").innerHTML = "";
    document.getElementById("cash").textContent = "-";
    document.getElementById("asset_qty").textContent = "-";
    document.getElementById("total_value").textContent = "-";
    document.getElementById("profit").textContent = "-";

    if (priceChart) {
      priceChart.destroy();
      priceChart = null;
    }

    console.log("Simulazione resettata");
  }

  // Esponiamo le funzioni globali che servono nel markup
  window.startSimulation = startSimulation;
  window.resetSimulation = resetSimulation;
});

document.getElementById("startScheduler").addEventListener("click", async () => {
  const coin = document.getElementById("coin").value;
  const interval = parseFloat(document.getElementById("interval").value);

  try {
    const res = await fetch("/api/scheduler/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coin: coin, interval: interval }),
    });
    const data = await res.json();
    alert(`Scheduler ${data.status} per ${data.coin} ogni ${data.interval_minutes} minuti`);
  } catch (e) {
    alert("Errore nell'avvio scheduler: " + e.message);
  }
});

document.getElementById("stopScheduler").addEventListener("click", async () => {
  try {
    const res = await fetch("/api/scheduler/stop", { method: "POST" });
    const data = await res.json();
    alert(`Scheduler ${data.status}`);
  } catch (e) {
    alert("Errore nel fermare scheduler: " + e.message);
  }
});
