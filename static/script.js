let priceChart;
let countdown = 300;
let countdownInterval;
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

  async function simulateNow() {
    if (!currentCoin) {
      updateStatus(null, "Simulazione non avviata correttamente.");
      return;
    }

    try {
      const res = await fetch("/api/sim/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();

      let coinName = currentCoin.toUpperCase();

      const price = (typeof data.price === "number") ? data.price.toFixed(2) : "N/A";
      const signal = (typeof data.signal === "string") ? data.signal.toUpperCase() : "N/A";
      const signalColor = data.signal === "buy" ? "green" : data.signal === "sell" ? "red" : "#ccc";
      const currentValue = (typeof data.total_value === "number") ? data.total_value.toFixed(2) : "N/A";
      const profitLoss = (typeof data.profit === "number") ? data.profit.toFixed(2) : "N/A";

      document.getElementById("result").innerHTML = `
        <p><strong>${coinName}</strong> — Prezzo attuale: €${price}</p>
        <p>Segnale: <span style="color: ${signalColor}">${signal}</span></p>
        <p>Valore portafoglio: €${currentValue}</p>
        <p>Profitto stimato: €${profitLoss}</p>
      `;

      // Aggiorna grafico (mock dati fittizi)
      const history = await fetchPriceHistory(currentCoin);
      if (priceChart) {
        priceChart.data.labels = history.labels;
        priceChart.data.datasets[0].data = history.data;
        priceChart.update();
      } else {
        initChart(history.labels, history.data);
      }

      // Aggiorna dati di status
      updateStatus(data, `Ultima analisi: segnale ${signal}, prezzo €${price}`);
      renderHistory(data.history);

    } catch (error) {
      console.error("Errore nell'analisi:", error);
      updateStatus(null, "Errore nel recupero dati. Riprova più tardi.");
    }
  }

  function updateStatus(data, text) {
    const statusEl = document.getElementById("status");
    if (statusEl && data) {
      if (typeof data.cash === "number") statusEl.querySelector("#cash").textContent = data.cash.toFixed(2);
      if (typeof data.asset_qty === "number") statusEl.querySelector("#asset_qty").textContent = data.asset_qty.toFixed(6);
      if (typeof data.total_value === "number") statusEl.querySelector("#total_value").textContent = data.total_value.toFixed(2);
      if (typeof data.profit === "number") statusEl.querySelector("#profit").textContent = data.profit.toFixed(2);
    }

    const timerEl = document.getElementById("timer");
    if (timerEl) {
      timerEl.textContent = text;
    }
  }

  function renderHistory(history) {
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!history || history.length === 0) {
      tbody.innerHTML = "<tr><td colspan='7'>Nessuna operazione ancora effettuata.</td></tr>";
      return;
    }
    for (const row of history) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.timestamp}</td>
        <td>${row.action}</td>
        <td>${row.price.toFixed(2)}</td>
        <td>${row.cash.toFixed(2)}</td>
        <td>${row.asset_qty.toFixed(6)}</td>
        <td>${row.total_value.toFixed(2)}</td>
        <td>${row.profit.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
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
      const res = await fetch("/api/sim/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin_id: coin, investimento: investment })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      currentCoin = coin;
      updateStatus(data, "Simulazione avviata");
      renderHistory(data.history);
      simulateNow(); // Primo ciclo subito

      if (countdownInterval) clearInterval(countdownInterval);
      countdown = Math.round(intervalMinutes * 60);
      countdownInterval = setInterval(() => {
        countdown--;
        document.getElementById("timer").textContent = `Prossima analisi in ${countdown} secondi`;
        if (countdown <= 0) {
          simulateNow();
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

    currentCoin = null;
    fetch("/api/sim/reset", { method: "POST" }).catch(() => {});

    document.getElementById("timer").textContent = "";
    document.getElementById("result").innerHTML = "";
    document.getElementById("cash").textContent = "-";
    document.getElementById("asset_qty").textContent = "-";
    document.getElementById("total_value").textContent = "-";
    document.getElementById("profit").textContent = "-";

    const tbody = document.getElementById("historyTableBody");
    if (tbody) tbody.innerHTML = "<tr><td colspan='7'>Nessuna operazione ancora effettuata.</td></tr>";

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
