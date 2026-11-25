// @author piercer
(() => {
  const $ = (id) => document.getElementById(id);
  const LETTERS = ["B", "I", "N", "G", "O"];
  let drawn = [];
  let autoId = null;

  function maxBalls() {
    return Number($("bingoMode").value) || 75;
  }

  function labelBall(n) {
    if (maxBalls() === 90) return String(n);
    const col = Math.min(4, Math.floor((n - 1) / 15));
    return `${LETTERS[col]} ${n}`;
  }

  function speakBall(txt) {
    if (!$("ttsBingo").checked || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = "pt-BR";
    speechSynthesis.speak(u);
  }

  function renderBoard() {
    const max = maxBalls();
    const hitSet = new Set(drawn);
    $("drawnCount").textContent = `${drawn.length} / ${max}`;
    $("currentBall").textContent = drawn.length ? labelBall(drawn[0]) : "-";
    $("recentBalls").innerHTML = drawn.slice(1, 6).map((n) => `<span class="recent-pill">${labelBall(n)}</span>`).join("");

    let html = "";
    for (let i = 1; i <= max; i++) {
      html += `<div class="b-cell ${hitSet.has(i) ? "hit" : ""}">${labelBall(i)}</div>`;
    }
    $("ballBoard").innerHTML = html;
  }

  function drawOne() {
    const max = maxBalls();
    const hitSet = new Set(drawn);
    const avail = [];
    for (let i = 1; i <= max; i++) if (!hitSet.has(i)) avail.push(i);
    if (!avail.length) {
      if (autoId) { clearInterval(autoId); autoId = null; $("btnAutoBall").textContent = "Iniciar Auto"; }
      alert("Todas as bolas já foram sorteadas!");
      return;
    }
    const next = avail[Math.floor(Math.random() * avail.length)];
    drawn.unshift(next);
    renderBoard();
    speakBall(labelBall(next));
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function makeClassicCard() {
    const cols = [
      shuffle(Array.from({ length: 15 }, (_, i) => i + 1)).slice(0, 5),
      shuffle(Array.from({ length: 15 }, (_, i) => i + 16)).slice(0, 5),
      shuffle(Array.from({ length: 15 }, (_, i) => i + 31)).slice(0, 5),
      shuffle(Array.from({ length: 15 }, (_, i) => i + 46)).slice(0, 5),
      shuffle(Array.from({ length: 15 }, (_, i) => i + 61)).slice(0, 5),
    ];
    cols[2][2] = "LIVRE";
    const rows = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) rows.push(cols[c][r]);
    }
    return rows;
  }

  function makeCustomCard(words) {
    const pool = shuffle(words);
    const cells = [];
    let idx = 0;
    for (let i = 0; i < 25; i++) {
      if (i === 12) cells.push("LIVRE");
      else cells.push(pool[idx++ % pool.length] || `#${i + 1}`);
    }
    return cells;
  }

  function renderCards() {
    const qty = Math.min(40, Math.max(1, Number($("cardQty").value) || 6));
    const title = $("cardTitle").value.trim() || "BINGO";
    const type = $("cardType").value;
    const words = $("customWords").value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

    let html = "";
    for (let k = 1; k <= qty; k++) {
      const cells = type === "custom" && words.length ? makeCustomCard(words) : makeClassicCard();
      html += `
        <article class="bingo-card">
          <div class="bingo-title">${title}</div>
          <div class="bingo-sub">Cartela #${String(k).padStart(3, "0")}</div>
          <div class="bingo-grid">
            ${LETTERS.map((l) => `<div class="bingo-head">${l}</div>`).join("")}
            ${cells.map((v) => `<div class="bingo-cell ${v === "LIVRE" ? "free" : ""}">${v}</div>`).join("")}
          </div>
        </article>
      `;
    }
    $("cardsSheet").innerHTML = html;
  }

  $("btnDrawBall").addEventListener("click", drawOne);
  $("btnResetBingo").addEventListener("click", () => {
    if (autoId) { clearInterval(autoId); autoId = null; $("btnAutoBall").textContent = "Iniciar Auto"; }
    drawn = [];
    renderBoard();
  });
  $("bingoMode").addEventListener("change", () => {
    drawn = [];
    renderBoard();
  });
  $("btnAutoBall").addEventListener("click", () => {
    if (autoId) {
      clearInterval(autoId);
      autoId = null;
      $("btnAutoBall").textContent = "Iniciar Auto";
      return;
    }
    const sec = Math.max(2, Number($("autoSec").value) || 5);
    $("btnAutoBall").textContent = "Pausar Auto";
    drawOne();
    autoId = setInterval(drawOne, sec * 1000);
  });

  $("cardType").addEventListener("change", () => {
    $("customWordsWrap").classList.toggle("hidden", $("cardType").value !== "custom");
  });
  $("btnGenCards").addEventListener("click", renderCards);
  $("btnPrintCards").addEventListener("click", () => window.print());

  document.querySelectorAll(".tab[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab[data-tab]").forEach((b) => b.classList.toggle("active", b === btn));
      const isCaller = btn.dataset.tab === "caller";
      $("panelCaller").classList.toggle("hidden", !isCaller);
      $("panelCards").classList.toggle("hidden", isCaller);
    });
  });

  renderBoard();
  renderCards();
})();

(() => {
  const AUTO_KEY = "piercer_autosave_piercer_bingo-party-studio";
  const ctrls = () => [...document.querySelectorAll('input[id]:not([type=file]), select[id], textarea[id]')];
  function saveForm() {
    const data = {};
    for (const el of ctrls()) data[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    localStorage.setItem(AUTO_KEY, JSON.stringify(data));
  }
  try {
    const saved = JSON.parse(localStorage.getItem(AUTO_KEY) || 'null');
    if (saved) {
      for (const el of ctrls()) {
        if (!(el.id in saved)) continue;
        if (el.type === 'checkbox') el.checked = !!saved[el.id];
        else el.value = saved[el.id];
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  } catch {}
  document.addEventListener('input', saveForm);
  document.addEventListener('change', saveForm);
})();
