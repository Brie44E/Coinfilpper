const STARTING_BANKROLL = 25;
const MAX_PAYOUT = 250;
const HEADS_PROBABILITY = 0.6;
const HIGHSCORE_KEY = "biased-coin-highscores";

const state = {
  bankroll: STARTING_BANKROLL,
  flips: 0,
  bestRun: STARTING_BANKROLL,
  history: [],
  gameOver: false,
};

const els = {
  form: document.querySelector("#bet-form"),
  coin: document.querySelector("#coin"),
  resultText: document.querySelector("#result-text"),
  bankroll: document.querySelector("#bankroll"),
  flips: document.querySelector("#flips"),
  profit: document.querySelector("#profit"),
  bestRun: document.querySelector("#best-run"),
  goalCopy: document.querySelector("#goal-copy"),
  goalProgress: document.querySelector("#goal-progress"),
  betAmount: document.querySelector("#bet-amount"),
  betSlider: document.querySelector("#bet-slider"),
  quickActions: document.querySelectorAll("[data-fraction]"),
  newGame: document.querySelector("#new-game"),
  clearHistory: document.querySelector("#clear-history"),
  historyList: document.querySelector("#history-list"),
  saveScore: document.querySelector("#save-score"),
  leaderboardBody: document.querySelector("#leaderboard-body"),
  flipButton: document.querySelector("#flip-button"),
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomUnit() {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / (0xffffffff + 1);
}

function getHighscores() {
  try {
    return JSON.parse(localStorage.getItem(HIGHSCORE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function setHighscores(scores) {
  localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(scores));
}

function updateBetFromSlider() {
  const fraction = Number(els.betSlider.value) / 100;
  const nextAmount = state.bankroll * fraction;
  els.betAmount.value = nextAmount.toFixed(2);
}

function syncSliderFromBet() {
  const amount = Number(els.betAmount.value);
  const fraction = state.bankroll > 0 ? (amount / state.bankroll) * 100 : 0;
  els.betSlider.value = String(clamp(Math.round(fraction), 0, 100));
}

function renderStats() {
  const profit = state.bankroll - STARTING_BANKROLL;
  const progress = clamp((state.bankroll / MAX_PAYOUT) * 100, 0, 100);

  els.bankroll.textContent = formatCurrency(state.bankroll);
  els.flips.textContent = String(state.flips);
  els.profit.textContent = formatCurrency(profit);
  els.profit.className = profit >= 0 ? "win" : "loss";
  els.bestRun.textContent = formatCurrency(state.bestRun);
  els.goalCopy.textContent = `${formatCurrency(state.bankroll)} / ${formatCurrency(MAX_PAYOUT)}`;
  els.goalProgress.style.width = `${progress}%`;

  const maxBet = Math.max(0, state.bankroll);
  els.betAmount.max = maxBet.toFixed(2);
  if (Number(els.betAmount.value) > maxBet) {
    els.betAmount.value = maxBet.toFixed(2);
  }

  if (state.gameOver) {
    els.flipButton.disabled = true;
    els.flipButton.textContent = "Game over";
  } else {
    els.flipButton.disabled = false;
    els.flipButton.textContent = "Flip coin";
  }
}

function renderHistory() {
  if (state.history.length === 0) {
    els.historyList.innerHTML = "<li>No flips yet.</li>";
    return;
  }

  els.historyList.innerHTML = state.history
    .slice()
    .reverse()
    .map((entry) => {
      const outcome = entry.won ? "Won" : "Lost";
      const className = entry.won ? "win" : "loss";
      return `
        <li>
          <span class="badge">#${entry.flip}</span>
          <span>${entry.side} on ${entry.result}</span>
          <span class="${className}">${outcome} ${formatCurrency(entry.amount)}</span>
        </li>
      `;
    })
    .join("");
}

function renderLeaderboard() {
  const scores = getHighscores();

  if (scores.length === 0) {
    els.leaderboardBody.innerHTML = `
      <tr>
        <td colspan="4">No saved scores yet.</td>
      </tr>
    `;
    return;
  }

  els.leaderboardBody.innerHTML = scores
    .map(
      (score, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${formatCurrency(score.bankroll)}</td>
          <td>${score.flips}</td>
          <td>${new Date(score.date).toLocaleDateString()}</td>
        </tr>
      `,
    )
    .join("");
}

function render() {
  renderStats();
  renderHistory();
  renderLeaderboard();
}

function endIfNeeded() {
  if (state.bankroll <= 0.009) {
    state.bankroll = 0;
    state.gameOver = true;
    els.resultText.textContent = "Bankroll is gone. Start a new run to try again.";
  }

  if (state.bankroll >= MAX_PAYOUT) {
    state.bankroll = MAX_PAYOUT;
    state.gameOver = true;
    els.resultText.textContent = "You reached the $250 cap. Save it to the highscore table.";
  }
}

function flipCoin(event) {
  event.preventDefault();

  if (state.gameOver) return;

  const formData = new FormData(els.form);
  const side = formData.get("side");
  const rawAmount = Number(formData.get("amount"));
  const amount = clamp(rawAmount, 0.01, state.bankroll);

  if (!Number.isFinite(amount) || amount <= 0) {
    els.resultText.textContent = "Enter a bet greater than $0.";
    return;
  }

  const result = randomUnit() < HEADS_PROBABILITY ? "heads" : "tails";
  const won = side === result;
  state.bankroll = won ? state.bankroll + amount : state.bankroll - amount;
  state.bankroll = Number(state.bankroll.toFixed(2));
  state.flips += 1;
  state.bestRun = Math.max(state.bestRun, state.bankroll);

  state.history.push({
    flip: state.flips,
    side,
    result,
    amount,
    won,
  });

  els.coin.textContent = result === "heads" ? "H" : "T";
  els.coin.dataset.side = result === "heads" ? "H" : "T";
  els.coin.classList.remove("flip");
  window.requestAnimationFrame(() => els.coin.classList.add("flip"));

  const verb = won ? "won" : "lost";
  els.resultText.textContent = `It landed ${result}. You ${verb} ${formatCurrency(amount)}.`;

  endIfNeeded();
  syncSliderFromBet();
  render();
}

function resetGame() {
  state.bankroll = STARTING_BANKROLL;
  state.flips = 0;
  state.bestRun = STARTING_BANKROLL;
  state.history = [];
  state.gameOver = false;
  els.betSlider.value = "20";
  updateBetFromSlider();
  els.coin.textContent = "H";
  els.resultText.textContent = "Start with $25. Bet any amount on heads or tails.";
  render();
}

function clearHistory() {
  state.history = [];
  renderHistory();
}

function saveScore() {
  const scores = getHighscores();
  scores.push({
    bankroll: state.bankroll,
    flips: state.flips,
    date: new Date().toISOString(),
  });

  scores.sort((a, b) => b.bankroll - a.bankroll || a.flips - b.flips);
  setHighscores(scores.slice(0, 10));
  renderLeaderboard();
}

els.form.addEventListener("submit", flipCoin);
els.betSlider.addEventListener("input", updateBetFromSlider);
els.betAmount.addEventListener("input", syncSliderFromBet);
els.newGame.addEventListener("click", resetGame);
els.clearHistory.addEventListener("click", clearHistory);
els.saveScore.addEventListener("click", saveScore);

els.quickActions.forEach((button) => {
  button.addEventListener("click", () => {
    const fraction = Number(button.dataset.fraction);
    els.betSlider.value = String(Math.round(fraction * 100));
    updateBetFromSlider();
  });
});

resetGame();
