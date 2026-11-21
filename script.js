/* ============================================================
   2nd Standard Learning Adventure – App Logic
   Vanilla JS, no dependencies. All progress lives in
   localStorage under STORAGE_KEY.
============================================================ */

const STORAGE_KEY = "expeditionClass2Save";

const BADGES = {
  first_steps:    { icon: "🥾", name: "First Steps",    desc: "Completed your first chapter" },
  perfectionist:  { icon: "🌟", name: "Perfectionist",  desc: "Earned 3 stars on a chapter" },
  streak_3:       { icon: "🔥", name: "On a Roll",      desc: "3-day learning streak" },
  coin_collector: { icon: "💰", name: "Coin Collector", desc: "Collected 200 coins" },
  subject_master: { icon: "🏆", name: "Trail Master",   desc: "3-starred an entire subject" }
};

const MODES = {
  adventure: { icon: "🧭", name: "Adventure Quiz", desc: "Work through every question. Get one wrong and it comes back for another try." },
  time:      { icon: "⏱️", name: "Time Challenge", desc: "60 seconds, as many correct answers as you can!" },
  memory:    { icon: "🧠", name: "Memory Match",   desc: "Flip cards to match each question with its answer." },
  match:     { icon: "🎯", name: "Match the Following", desc: "Tap a question, then tap its answer." },
  spin:      { icon: "🎡", name: "Spin & Win",     desc: "Spin for a coin multiplier, then answer 3 bonus questions." }
};

/* ---------------- State ---------------- */
let state = null;
let nav = { subject: null, chapter: null, mode: null };
let quizRuntime = null; // transient state for whichever game mode is running

function defaultState() {
  return {
    name: "",
    coins: 0,
    xp: 0,
    streak: { count: 0, lastDate: null },
    badges: [],
    progress: {} // progress[subjectKey][chapterId] = { stars, bestAccuracy, adventureDone }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    state = Object.assign(defaultState(), saved);
    // Make sure nested pieces exist even in older saves
    if (!state.streak || typeof state.streak !== 'object') state.streak = { count: 0, lastDate: null };
    if (!Array.isArray(state.badges)) state.badges = [];
    if (!state.progress || typeof state.progress !== 'object') state.progress = {};
  } catch (e) {
    state = defaultState();
  }
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save progress:', e);
  }
}

/* ---------------- Helpers ---------------- */
function el(html) {
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return div.firstChild;
}
// Escape text before putting it into HTML (names, questions, options)
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function letterFor(i) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  return letters[i] || (i + 10).toString(36).toUpperCase();
}
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function dateKey(d) {
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function getToday() { return dateKey(new Date()); }
function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

// Put new HTML on the page and make its .screen visible.
// (The CSS hides every .screen unless it also has the "active" class.)
function render(html) {
  const area = document.getElementById('app');
  area.innerHTML = html;
  const screen = area.querySelector('.screen');
  if (screen) screen.classList.add('active');
  window.scrollTo(0, 0);
}

// Stop any running timers from the current game
function stopRuntime() {
  if (!quizRuntime) return;
  clearInterval(quizRuntime.timerHandle);
  clearTimeout(quizRuntime.nextTimeout);
  quizRuntime.finished = true;
}

function currentChapter() {
  const sub = QUESTION_BANK[nav.subject];
  return sub ? sub.chapters.find(c => c.id === nav.chapter) : null;
}

/* ---------------- Question pools ---------------- */
function chapterQuestions(subjectKey, chapterId) {
  return QUESTION_BANK[subjectKey].questions.filter(q => q.chapter === chapterId);
}
// The chapter's own questions, topped up from the same subject if there are fewer than `min`
function poolWithTopUp(subjectKey, chapterId, min) {
  let pool = chapterQuestions(subjectKey, chapterId);
  if (pool.length < min) {
    const others = shuffle(QUESTION_BANK[subjectKey].questions.filter(q => q.chapter !== chapterId));
    pool = pool.concat(others.slice(0, min - pool.length));
  }
  return pool;
}
// Keep only one question per answer text (so matching games never have two identical answers)
function uniqueByAnswer(list) {
  const seen = new Set();
  return list.filter(q => {
    const a = q.options[q.answer];
    if (seen.has(a)) return false;
    seen.add(a);
    return true;
  });
}

/* ---------------- Rewards, streak, badges ---------------- */
function applyRewards(coins, xp) {
  state.coins += coins;
  state.xp += xp;
  const today = getToday();
  if (state.streak.lastDate !== today) {
    state.streak.count = (state.streak.lastDate === getYesterday()) ? state.streak.count + 1 : 1;
    state.streak.lastDate = today;
  }
  const newBadges = checkAndAwardBadges();
  saveState();
  return newBadges;
}

function checkAndAwardBadges() {
  const earned = [];
  const give = (id, condition) => {
    if (condition && state.badges.indexOf(id) === -1) {
      state.badges.push(id);
      earned.push(id);
    }
  };
  const allChapters = Object.values(state.progress).flatMap(sub => Object.values(sub));
  give('first_steps', allChapters.some(c => c.adventureDone));
  give('perfectionist', allChapters.some(c => c.stars === 3));
  give('coin_collector', state.coins >= 200);
  give('streak_3', state.streak.count >= 3);
  give('subject_master', Object.keys(QUESTION_BANK).some(subKey =>
    QUESTION_BANK[subKey].chapters.every(chap => {
      const prog = state.progress[subKey] && state.progress[subKey][chap.id];
      return prog && prog.stars === 3;
    })
  ));
  return earned;
}

/* ---------------- Home Screen ---------------- */
function renderHome() {
  stopRuntime();
  const badgeHtml = state.badges
    .map(id => BADGES[id]).filter(Boolean)
    .map(b => `<span class="badge" title="${esc(b.desc)}">${b.icon} ${esc(b.name)}</span>`)
    .join('');

  render(`
    <section class="screen" id="home">
      <h1>Welcome, Explorer! 🌟</h1>
      <p>Choose a subject to begin your learning adventure.</p>
      <div class="subject-grid">
        ${Object.keys(QUESTION_BANK).map(key => {
          const sub = QUESTION_BANK[key];
          return `
            <button class="btn subject-btn" data-subject="${key}">
              <div class="subject-icon">${sub.icon}</div>
              <div>${esc(sub.name)}</div>
            </button>`;
        }).join('')}
      </div>
      ${state.name
        ? `<p class="stats">Hello, ${esc(state.name)}! 🪙 ${state.coins} coins | ✨ ${state.xp} XP | 🔥 ${state.streak.count}-day streak</p>
           ${badgeHtml ? `<div class="badge-row">${badgeHtml}</div>` : ''}`
        : `<div class="name-box">
             <input type="text" id="nameInput" maxlength="20" placeholder="Enter your name" />
             <button class="btn" id="setNameBtn">Start</button>
           </div>`}
    </section>
  `);

  if (!state.name) {
    const input = document.getElementById('nameInput');
    const button = document.getElementById('setNameBtn');
    button.addEventListener('click', () => {
      const name = input.value.trim();
      if (name) {
        state.name = name;
        saveState();
        renderHome();
      } else {
        input.focus();
      }
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') button.click();
    });
  }

  document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      nav.subject = btn.dataset.subject;
      nav.chapter = null;
      renderSubjectMenu();
    });
  });
}

/* ---------------- Subject Menu (Chapters) ---------------- */
function renderSubjectMenu() {
  stopRuntime();
  const sub = QUESTION_BANK[nav.subject];
  if (!sub) { renderHome(); return; }

  render(`
    <section class="screen" id="subject-menu">
      <h1>${sub.icon} ${esc(sub.name)}</h1>
      <p>Select a chapter to explore.</p>
      <div class="chapter-grid">
        ${sub.chapters.map(chap => {
          const prog = (state.progress[nav.subject] && state.progress[nav.subject][chap.id]) || {};
          const stars = Math.min(3, prog.stars || 0);
          const starHtml = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
          return `
            <button class="btn chapter-btn" data-chapter="${chap.id}">
              <div>${chap.icon} ${esc(chap.name)}</div>
              <div class="chapter-stars">${starHtml}</div>
            </button>`;
        }).join('')}
      </div>
      <button class="btn" id="backToHome">← Back to Subjects</button>
    </section>
  `);

  document.getElementById('backToHome').addEventListener('click', renderHome);
  document.querySelectorAll('.chapter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      nav.chapter = btn.dataset.chapter;
      renderModeMenu();
    });
  });
}

/* ---------------- Mode Menu ---------------- */
function renderModeMenu() {
  stopRuntime();
  const chapter = currentChapter();
  if (!chapter) { renderSubjectMenu(); return; }

  render(`
    <section class="screen" id="mode-menu">
      <h1>${chapter.icon} ${esc(chapter.name)}</h1>
      <p>Choose a game mode:</p>
      <div class="mode-grid">
        ${Object.keys(MODES).map(key => {
          const m = MODES[key];
          return `
            <button class="btn mode-btn" data-mode="${key}">
              <div class="mode-icon">${m.icon}</div>
              <div>${esc(m.name)}</div>
              <div class="mode-desc">${esc(m.desc)}</div>
            </button>`;
        }).join('')}
      </div>
      <button class="btn" id="backToChapters">← Back to Chapters</button>
    </section>
  `);

  document.getElementById('backToChapters').addEventListener('click', renderSubjectMenu);
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      nav.mode = btn.dataset.mode;
      startMode();
    });
  });
}

/* ---------------- Start Mode ---------------- */
function startMode() {
  stopRuntime();
  if (!currentChapter()) { renderHome(); return; }
  if (poolWithTopUp(nav.subject, nav.chapter, 1).length === 0) {
    showNotice('No questions yet', 'This chapter has no questions. Add some in questions.js.');
    return;
  }
  if (nav.mode === 'adventure') startAdventureQuiz();
  else if (nav.mode === 'time') startTimeChallenge();
  else if (nav.mode === 'memory') startMemoryMatch();
  else if (nav.mode === 'match') startMatchFollowing();
  else if (nav.mode === 'spin') startSpinWin();
  else renderHome();
}

function showNotice(title, message) {
  render(`
    <section class="screen" id="notice">
      <h1>${esc(title)}</h1>
      <p>${esc(message)}</p>
      <button class="btn" id="backToMode">← Back</button>
    </section>
  `);
  document.getElementById('backToMode').addEventListener('click', renderModeMenu);
}

/* ---------------- Shared question card ---------------- */
function buildExplainHtml(question, isCorrect, pickedText) {
  const correctText = question.options[question.answer];
  if (isCorrect) {
    return `<div class="correct-line">✅ Correct! <strong>${esc(correctText)}</strong> is the right answer.</div>
            ${question.explanation ? `<div class="explain-detail">${esc(question.explanation)}</div>` : ''}`;
  }
  return `
    <div class="wrong-line">❌ You picked <strong>${esc(pickedText)}</strong>.</div>
    <div class="explain-correct">The correct answer is <strong>${esc(correctText)}</strong>.</div>
    ${question.explanation ? `<div class="explain-detail">${esc(question.explanation)}</div>` : ''}`;
}

// Builds a question with shuffled option buttons.
// Calls onAnswer(isCorrect, cardElement) once, when an option is clicked.
function buildQuestionCard(question, onAnswer) {
  const card = el(`
    <div class="question-card">
      ${question.difficulty ? `<span class="difficulty-tag ${esc(question.difficulty)}">${esc(question.difficulty.toUpperCase())}</span>` : ''}
      <div class="question-text">${esc(question.q)}</div>
      ${question.img ? `<img class="question-img" src="${esc(question.img)}" alt="">` : ''}
      <div class="options-list"></div>
      <div class="explain-box"></div>
      <div class="after-answer"></div>
    </div>`);

  // If the picture file is missing, just hide it instead of showing a broken icon
  const img = card.querySelector('.question-img');
  if (img) img.addEventListener('error', () => { img.style.display = 'none'; });

  const list = card.querySelector('.options-list');
  const shuffled = shuffle(question.options.map((text, idx) => ({ text, idx })));
  shuffled.forEach(({ text, idx }, pos) => {
    const btn = el(`<button type="button" class="option-btn" data-original-index="${idx}">
      <span class="opt-letter">${letterFor(pos)}</span><span>${esc(text)}</span></button>`);
    btn.addEventListener('click', () => {
      list.querySelectorAll('.option-btn').forEach(b => { b.disabled = true; });
      const isCorrect = idx === question.answer;
      btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if (!isCorrect) {
        const correctBtn = list.querySelector(`[data-original-index="${question.answer}"]`);
        if (correctBtn) correctBtn.classList.add('correct');
      }
      const box = card.querySelector('.explain-box');
      box.innerHTML = buildExplainHtml(question, isCorrect, text);
      box.classList.add('show', isCorrect ? 'correct-answer' : 'wrong-answer');
      onAnswer(isCorrect, card);
    });
    list.appendChild(btn);
  });
  return card;
}

function addNextButton(card, label, onClick) {
  const btn = el(`<button type="button" class="btn">${esc(label)}</button>`);
  btn.addEventListener('click', onClick);
  card.querySelector('.after-answer').appendChild(btn);
}

function quitButtonHtml() {
  return `<button type="button" class="btn small" id="quitBtn">← Quit</button>`;
}
function wireQuit() {
  const q = document.getElementById('quitBtn');
  if (q) q.addEventListener('click', renderModeMenu);
}

/* ---------------- Adventure Quiz ---------------- */
function startAdventureQuiz() {
  const questions = shuffle(chapterQuestions(nav.subject, nav.chapter).slice());
  quizRuntime = {
    kind: 'adventure',
    subjectKey: nav.subject,
    chapterId: nav.chapter,
    queue: questions,
    total: questions.length,
    roundsAnswered: 0,
    correctCount: 0,
    maxRounds: questions.length * 2, // allow retries
    coinsEarned: 0,
    xpEarned: 0,
    finished: false
  };
  renderAdventureQuestion();
}

function renderAdventureQuestion() {
  const r = quizRuntime;
  if (r.queue.length === 0 || r.roundsAnswered >= r.maxRounds) {
    finishAdventureQuiz();
    return;
  }
  const question = r.queue.shift();
  const chapter = currentChapter();

  render(`
    <section class="screen" id="quiz-screen">
      <div class="quiz-topline">
        ${quitButtonHtml()}
        <span>${chapter.icon} ${esc(chapter.name)}</span>
        <span>Questions left: ${r.queue.length + 1}</span>
      </div>
      <div id="cardHolder"></div>
    </section>
  `);
  wireQuit();

  const card = buildQuestionCard(question, (isCorrect, cardEl) => {
    r.roundsAnswered++;
    if (isCorrect) {
      r.correctCount++;
      r.coinsEarned += 10;
      r.xpEarned += 5;
    } else {
      r.queue.push(question); // comes back for another try
    }
    const lastOne = r.queue.length === 0 || r.roundsAnswered >= r.maxRounds;
    addNextButton(cardEl, lastOne ? 'Finish ✓' : (isCorrect ? 'Next →' : 'Next (this one will come back) →'),
      renderAdventureQuestion);
  });
  document.getElementById('cardHolder').appendChild(card);
}

function starsFor(accuracy) {
  if (accuracy >= 95) return 3;
  if (accuracy >= 80) return 2;
  if (accuracy >= 50) return 1;
  return 0;
}

function finishAdventureQuiz() {
  const r = quizRuntime;
  if (!r || r.finished) return;
  r.finished = true;

  const accuracy = r.roundsAnswered ? Math.round((r.correctCount / r.roundsAnswered) * 100) : 0;
  const completed = r.queue.length === 0;

  const subProg = state.progress[r.subjectKey] || {};
  const chapProg = subProg[r.chapterId] || {};
  chapProg.bestAccuracy = Math.max(chapProg.bestAccuracy || 0, accuracy);
  chapProg.stars = Math.max(chapProg.stars || 0, starsFor(accuracy));
  if (completed) chapProg.adventureDone = true;
  subProg[r.chapterId] = chapProg;
  state.progress[r.subjectKey] = subProg;

  const newBadges = applyRewards(r.coinsEarned, r.xpEarned);
  const stars = '⭐'.repeat(starsFor(accuracy)) || 'No stars yet - try again!';
  showResultScreen(
    completed ? 'Adventure Complete!' : 'Good effort!',
    `Accuracy: ${accuracy}% ${stars}. You earned ${r.coinsEarned} coins and ${r.xpEarned} XP.`,
    r.coinsEarned, r.xpEarned, newBadges
  );
}

/* ---------------- Time Challenge ---------------- */
function startTimeChallenge() {
  const pool = poolWithTopUp(nav.subject, nav.chapter, 3);
  quizRuntime = {
    kind: 'time',
    queue: shuffle(pool.slice()),
    qIdx: 0,
    correct: 0,
    asked: 0,
    coinsEarned: 0,
    xpEarned: 0,
    timeLeft: 60,
    timerHandle: null,
    nextTimeout: null,
    finished: false
  };
  renderTimeQuestion();
  startTimer();
}

function renderTimeQuestion() {
  const r = quizRuntime;
  if (!r || r.finished) return;
  // Not enough questions? Shuffle and go round again until time runs out.
  if (r.qIdx >= r.queue.length) {
    r.queue = shuffle(r.queue.slice());
    r.qIdx = 0;
  }
  const question = r.queue[r.qIdx];

  render(`
    <section class="screen" id="time-screen">
      <div class="quiz-topline">
        ${quitButtonHtml()}
        <span class="timer-badge">⏱️ <span id="timerBadge">${r.timeLeft}s</span></span>
        <span>Score: ${r.correct}/${r.asked}</span>
      </div>
      <div id="cardHolder"></div>
    </section>
  `);
  wireQuit();

  const card = buildQuestionCard(question, isCorrect => {
    r.asked++;
    if (isCorrect) {
      r.correct++;
      r.coinsEarned += 5;
      r.xpEarned += 2;
    }
    r.nextTimeout = setTimeout(() => {
      r.qIdx++;
      renderTimeQuestion();
    }, 1200);
  });
  document.getElementById('cardHolder').appendChild(card);
}

function startTimer() {
  const r = quizRuntime;
  r.timerHandle = setInterval(() => {
    r.timeLeft--;
    const badge = document.getElementById('timerBadge');
    if (badge) badge.textContent = `${Math.max(r.timeLeft, 0)}s`;
    if (r.timeLeft <= 0) finishTimeChallenge();
  }, 1000);
}

function finishTimeChallenge() {
  const r = quizRuntime;
  if (!r || r.finished) return; // guards against rewarding twice
  r.finished = true;
  clearInterval(r.timerHandle);
  clearTimeout(r.nextTimeout);
  const newBadges = applyRewards(r.coinsEarned, r.xpEarned);
  showResultScreen(
    `Time's Up!`,
    `You got ${r.correct} correct out of ${r.asked}. Earned ${r.coinsEarned} coins and ${r.xpEarned} XP.`,
    r.coinsEarned, r.xpEarned, newBadges
  );
}

/* ---------------- Memory Match ---------------- */
function startMemoryMatch() {
  // Chapter questions come first, topped up from the same subject; one per answer text
  const pool = uniqueByAnswer(poolWithTopUp(nav.subject, nav.chapter, 6)).slice(0, 6);
  const cards = [];
  pool.forEach((q, i) => {
    cards.push({ pair: i, text: q.q });
    cards.push({ pair: i, text: q.options[q.answer] });
  });
  quizRuntime = {
    kind: 'memory',
    cards: shuffle(cards),
    pairs: pool.length,
    open: [],
    matched: 0,
    moves: 0,
    locked: false,
    nextTimeout: null,
    finished: false
  };
  renderMemory();
}

function renderMemory() {
  const r = quizRuntime;
  render(`
    <section class="screen" id="memory-screen">
      <div class="quiz-topline">
        ${quitButtonHtml()}
        <span>Match each question with its answer</span>
        <span>Moves: <span id="moveCount">0</span></span>
      </div>
      <div class="memory-grid">
        ${r.cards.map((c, i) => `
          <button type="button" class="memory-card" data-i="${i}">
            <span class="card-back">❓</span>
            <span class="card-front">${esc(c.text)}</span>
          </button>`).join('')}
      </div>
    </section>
  `);
  wireQuit();

  const buttons = document.querySelectorAll('.memory-card');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i);
      if (r.finished || r.locked || btn.classList.contains('flipped') || btn.classList.contains('matched')) return;
      btn.classList.add('flipped');
      r.open.push(i);
      if (r.open.length < 2) return;

      r.moves++;
      document.getElementById('moveCount').textContent = r.moves;
      const [a, b] = r.open;
      if (r.cards[a].pair === r.cards[b].pair) {
        [a, b].forEach(k => buttons[k].classList.add('matched'));
        r.open = [];
        r.matched++;
        if (r.matched === r.pairs) {
          r.nextTimeout = setTimeout(finishMemoryMatch, 700);
        }
      } else {
        r.locked = true;
        r.nextTimeout = setTimeout(() => {
          [a, b].forEach(k => buttons[k].classList.remove('flipped'));
          r.open = [];
          r.locked = false;
        }, 900);
      }
    });
  });
}

function finishMemoryMatch() {
  const r = quizRuntime;
  if (!r || r.kind !== 'memory') return;
  r.finished = true;
  const coins = r.pairs * 5 + (r.moves <= r.pairs + 2 ? 10 : 0);
  const xp = r.pairs * 2;
  const newBadges = applyRewards(coins, xp);
  showResultScreen('You matched them all! 🎉', `You finished in ${r.moves} moves.`, coins, xp, newBadges);
}

/* ---------------- Match the Following (tap a term, then tap its answer) ---------------- */
function startMatchFollowing() {
  const pool = uniqueByAnswer(poolWithTopUp(nav.subject, nav.chapter, 6)).slice(0, 5);
  const pairs = pool.map((q, i) => ({ id: i, term: q.q, meaning: q.options[q.answer] }));
  quizRuntime = {
    kind: 'match',
    pairs,
    rightOrder: shuffle(pairs.slice()),
    selected: null,
    matched: 0,
    mistakes: 0,
    nextTimeout: null,
    finished: false
  };
  renderMatch();
}

function renderMatch() {
  const r = quizRuntime;
  render(`
    <section class="screen" id="match-screen">
      <div class="quiz-topline">
        ${quitButtonHtml()}
        <span>Tap a question, then tap its answer</span>
        <span>Mistakes: <span id="mistakeCount">0</span></span>
      </div>
      <div class="match-columns">
        <div class="match-col" id="leftCol">
          ${r.pairs.map(p => `<button type="button" class="match-item" data-id="${p.id}">${esc(p.term)}</button>`).join('')}
        </div>
        <div class="match-col" id="rightCol">
          ${r.rightOrder.map(p => `<button type="button" class="match-item" data-id="${p.id}">${esc(p.meaning)}</button>`).join('')}
        </div>
      </div>
    </section>
  `);
  wireQuit();

  const leftBtns = document.querySelectorAll('#leftCol .match-item');
  const rightBtns = document.querySelectorAll('#rightCol .match-item');

  leftBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (r.finished || btn.classList.contains('matched')) return;
      leftBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      r.selected = Number(btn.dataset.id);
    });
  });

  rightBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (r.finished || r.selected === null || btn.classList.contains('matched')) return;
      const id = Number(btn.dataset.id);
      if (id === r.selected) {
        btn.classList.add('matched');
        leftBtns.forEach(b => {
          if (Number(b.dataset.id) === id) b.classList.add('matched');
          b.classList.remove('selected');
        });
        r.selected = null;
        r.matched++;
        if (r.matched === r.pairs.length) {
          r.nextTimeout = setTimeout(finishMatchFollowing, 700);
        }
      } else {
        r.mistakes++;
        document.getElementById('mistakeCount').textContent = r.mistakes;
        btn.classList.add('wrong');
        setTimeout(() => btn.classList.remove('wrong'), 400);
      }
    });
  });
}

function finishMatchFollowing() {
  const r = quizRuntime;
  if (!r || r.kind !== 'match') return;
  r.finished = true;
  const n = r.pairs.length;
  const coins = Math.max(n * 3, n * 8 - r.mistakes * 2);
  const xp = n * 3;
  const newBadges = applyRewards(coins, xp);
  showResultScreen('All matched! 🎯', `You made ${r.mistakes} mistake${r.mistakes === 1 ? '' : 's'}.`, coins, xp, newBadges);
}

/* ---------------- Spin & Win ---------------- */
function startSpinWin() {
  const pool = shuffle(poolWithTopUp(nav.subject, nav.chapter, 3).slice());
  quizRuntime = {
    kind: 'spin',
    bonus: pool.slice(0, 3),
    multiplier: 1,
    qIdx: 0,
    correct: 0,
    coinsEarned: 0,
    xpEarned: 0,
    timerHandle: null,
    nextTimeout: null,
    finished: false
  };
  renderSpin();
}

function renderSpin() {
  const r = quizRuntime;
  render(`
    <section class="screen" id="spin-screen">
      <div class="quiz-topline">${quitButtonHtml()}<span>Spin & Win</span><span></span></div>
      <div class="wheel" id="wheel">🎡</div>
      <p id="spinMsg">Spin to choose your coin multiplier!</p>
      <button type="button" class="btn" id="spinBtn">Spin!</button>
    </section>
  `);
  wireQuit();

  const options = [1, 2, 3, 5];
  document.getElementById('spinBtn').addEventListener('click', e => {
    e.target.disabled = true;
    const wheel = document.getElementById('wheel');
    let ticks = 0;
    r.timerHandle = setInterval(() => {
      ticks++;
      wheel.textContent = '×' + options[Math.floor(Math.random() * options.length)];
      if (ticks >= 15) {
        clearInterval(r.timerHandle);
        r.multiplier = options[Math.floor(Math.random() * options.length)];
        wheel.textContent = '×' + r.multiplier;
        document.getElementById('spinMsg').textContent = `You got ×${r.multiplier}! Get ready for ${r.bonus.length} bonus question${r.bonus.length === 1 ? '' : 's'}...`;
        r.nextTimeout = setTimeout(renderSpinQuestion, 1200);
      }
    }, 80);
  });
}

function renderSpinQuestion() {
  const r = quizRuntime;
  if (!r || r.finished) return;
  if (r.qIdx >= r.bonus.length) { finishSpinWin(); return; }
  const question = r.bonus[r.qIdx];

  render(`
    <section class="screen" id="spin-quiz">
      <div class="quiz-topline">
        ${quitButtonHtml()}
        <span>Bonus ${r.qIdx + 1} of ${r.bonus.length}</span>
        <span>Multiplier ×${r.multiplier}</span>
      </div>
      <div id="cardHolder"></div>
    </section>
  `);
  wireQuit();

  const card = buildQuestionCard(question, (isCorrect, cardEl) => {
    if (isCorrect) {
      r.correct++;
      r.coinsEarned += 10 * r.multiplier;
      r.xpEarned += 5;
    }
    const last = r.qIdx + 1 >= r.bonus.length;
    addNextButton(cardEl, last ? 'Finish ✓' : 'Next →', () => {
      r.qIdx++;
      renderSpinQuestion();
    });
  });
  document.getElementById('cardHolder').appendChild(card);
}

function finishSpinWin() {
  const r = quizRuntime;
  if (!r || r.finished) return;
  r.finished = true;
  const newBadges = applyRewards(r.coinsEarned, r.xpEarned);
  showResultScreen('Spin & Win complete! 🎡',
    `You got ${r.correct} of ${r.bonus.length} right with a ×${r.multiplier} multiplier.`,
    r.coinsEarned, r.xpEarned, newBadges);
}

/* ---------------- Result Screen ---------------- */
function showResultScreen(title, message, coins, xp, newBadges) {
  const badgeHtml = (newBadges || [])
    .map(id => BADGES[id]).filter(Boolean)
    .map(b => `<div class="badge-new">${b.icon} New badge: <strong>${esc(b.name)}</strong> – ${esc(b.desc)}</div>`)
    .join('');

  render(`
    <section class="screen" id="result-screen">
      <h1>${esc(title)}</h1>
      <p>${esc(message)}</p>
      <div class="rewards">
        <span>🪙 Coins: +${coins}</span>
        <span>✨ XP: +${xp}</span>
      </div>
      ${badgeHtml}
      <div>
        <button type="button" class="btn" id="playAgain">Play Again</button>
        <button type="button" class="btn" id="modesBtn">Other Modes</button>
        <button type="button" class="btn" id="homeBtn">Home</button>
      </div>
    </section>
  `);
  document.getElementById('playAgain').addEventListener('click', startMode);
  document.getElementById('modesBtn').addEventListener('click', renderModeMenu);
  document.getElementById('homeBtn').addEventListener('click', renderHome);
}

/* ---------------- Init ---------------- */
function init() {
  try {
    loadState();
    renderHome();
  } catch (e) {
    console.error('Error in init:', e);
    const app = document.getElementById('app');
    if (app) app.innerHTML = '<p style="padding:2rem">Something went wrong while loading. Please refresh the page.</p>';
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
