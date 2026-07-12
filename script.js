/* ============================================================
   2nd Standard Learning Adventure – App Logic
   Vanilla JS, no dependencies. All progress lives in
   localStorage under STORAGE_KEY.
============================================================ */
console.log('2nd Standard script loaded');

const STORAGE_KEY = "expeditionClass2Save";

const BADGES = {
  first_steps:   { icon: "🥾", name: "First Steps",     desc: "Completed your first chapter" },
  perfectionist: { icon: "🌟", name: "Perfectionist",     desc: "Earned 3 stars on a chapter" },
  streak_3:      { icon: "🔥", name: "On a Roll",         desc: "3-day learning streak" },
  coin_collector:{ icon: "💰", name: "Coin Collector",    desc: "Collected 200 coins" },
  subject_master:{ icon: "🏆", name: "Trail Master",      desc: "3-starred an entire subject" },
  boss_slayer:   { icon: "👑", name: "Boss Slayer",       desc: "Defeated a Boss Battle" }
};

const MODES = {
  adventure: { icon: "🧭", name: "Adventure Quiz", desc: "Work through every idea. Get one wrong and it comes back for another try." },
  time:      { icon: "⏱️", name: "Time Challenge", desc: "60 seconds, as many correct answers as you can!" },
  memory:    { icon: "🧠", name: "Memory Match",    desc: "Flip cards to match terms with meanings." },
  match:     { icon: "🎯", name: "Match the Following", desc: "Drag each term onto its correct meaning." },
  spin:      { icon: "🎡", name: "Spin & Win", desc: "Spin for a coin multiplier, then answer 3 bonus questions." }
};

/* ---------------- State ---------------- */
let state = null;
let nav = { subject: null, chapter: null, mode: null, screenStack: [] };
let quizRuntime = null; // holds transient state for whichever quiz-like mode is running

function defaultState() {
  return {
    name: "",
    coins: 0,
    xp: 0,
    streak: { count: 0, lastDate: null },
    badges: [],
    progress: {} // progress[subjectKey][chapterKey] = { stars, bestAccuracy, adventureDone, modesPlayed:[...] }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
  } catch (e) {
    state = defaultState();
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------------- Helpers ---------------- */
function el(html) {
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return div.firstChild;
}
function letterFor(i) {
  const letters = ['A','B','C','D','E','F'];
  return letters[i] || (i+10).toString(36).toUpperCase();
}
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function getToday() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}

/* ---------------- Screens ---------------- */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add('active');
}
function pushScreen(id) {
  nav.screenStack.push(id);
  showScreen(id);
}
function popScreen() {
  nav.screenStack.pop();
  const prev = nav.screenStack.length ? nav.screenStack[nav.screenStack.length-1] : 'home';
  showScreen(prev);
}

/* ---------------- Home Screen ---------------- */
function renderHome() {
  console.log('renderHome called');
  const area = document.getElementById('app');
  area.innerHTML = `
    <section class="screen" id="home">
      <h1>Welcome, Explorer! 🌟</h1>
      <p>Choose a subject to begin your learning adventure.</p>
      <div class="subject-grid">
        ${Object.keys(QUESTION_BANK).map(key => {
          const sub = QUESTION_BANK[key];
          return `
            <button class="btn subject-btn" data-subject="${key}">
              <div class="subject-icon">${sub.icon}</div>
              <div>${sub.name}</div>
            </button>
          `;
        }).join('')}
      </div>
      ${state.name ? `<p>Hello, ${state.name}! Your coins: ${state.coins} | XP: ${state.xp}</p>` :
        `<div>
          <input type="text" id="nameInput" placeholder="Enter your name" />
          <button class="btn" id="setNameBtn">Start</button>
        </div>`}
    </section>
  `;
  // Set name if needed
  if (!state.name) {
    document.getElementById('setNameBtn')?.addEventListener('click', () => {
      const name = document.getElementById('nameInput').value.trim();
      if (name) {
        state.name = name;
        saveState();
        renderHome();
      }
    });
    document.getElementById('nameInput')?.addEventListener('keypress', e => {
      if (e.key === 'Enter') document.getElementById('setNameBtn').click();
    });
  }
  // Subject selection
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
  const sub = QUESTION_BANK[nav.subject];
  const area = document.getElementById('app');
  area.innerHTML = `
    <section class="screen" id="subject-menu">
      <h1>${sub.icon} ${sub.name}</h1>
      <p>Select a chapter to explore.</p>
      <div class="chapter-grid">
        ${sub.chapters.map((chap, idx) => {
          const prog = state.progress[nav.subject]?.[chap.id] || {};
          const stars = prog.stars || 0;
          const starHtml = '⭐'.repeat(stars) + '☆'.repeat(3-stars);
          return `
            <button class="btn chapter-btn" data-chapter="${chap.id}">
              <div>${chap.name}</div>
              <div class="chapter-stars">${starHtml}</div>
            </button>
          `;
        }).join('')}
      </div>
      <button class="btn" id="backToHome">← Back to Subjects</button>
    </section>
  `;
  document.getElementById('backToHome')?.addEventListener('click', renderHome);
  document.querySelectorAll('.chapter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      nav.chapter = btn.dataset.chapter;
      renderModeMenu();
    });
  });
}

/* ---------------- Mode Menu ---------------- */
function renderModeMenu() {
  const sub = QUESTION_BANK[nav.subject];
  const chapter = sub.chapters.find(c => c.id === nav.chapter);
  const area = document.getElementById('app');
  area.innerHTML = `
    <section class="screen" id="mode-menu">
      <h1>${chapter.icon} ${chapter.name}</h1>
      <p>Choose a game mode:</p>
      <div class="mode-grid">
        ${Object.keys(MODES).map(key => {
          const m = MODES[key];
          return `
            <button class="btn mode-btn" data-mode="${key}">
              <div class="mode-icon">${m.icon}</div>
              <div>${m.name}</div>
              <div class="mode-desc">${m.desc}</div>
            </button>
          `;
        }).join('')}
      </div>
      <button class="btn" id="backToChapters">← Back to Chapters</button>
    </section>
  `;
  document.getElementById('backToChapters')?.addEventListener('click', renderSubjectMenu);
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      nav.mode = btn.dataset.mode;
      startMode();
    });
  });
}

/* ---------------- Start Mode ---------------- */
function startMode() {
  if (nav.mode === 'adventure') startAdventureQuiz();
  else if (nav.mode === 'time') startTimeChallenge();
  else if (nav.mode === 'memory') startMemoryMatch();
  else if (nav.mode === 'match') startMatchFollowing();
  else if (nav.mode === 'spin') startSpinWin();
  else renderHome(); // fallback
}

/* ---------------- Adventure Quiz (core) ---------------- */
function startAdventureQuiz() {
  const sub = QUESTION_BANK[nav.subject];
  const chapter = sub.chapters.find(c => c.id === nav.chapter);
  const questions = chapter.questions.slice(); // copy
  quizRuntime = {
    kind: 'adventure',
    subjectKey: nav.subject,
    chapterId: nav.chapter,
    queue: questions,
    roundsAnswered: 0,
    maxRounds: questions.length * 2, // allow retries
    correctStreak: 0,
    coinsEarned: 0,
    xpEarned: 0
  };
  renderQuizQuestionAdventure();
}
function renderQuizQuestionAdventure() {
  const r = quizRuntime;
  if (r.queue.length === 0 || r.roundsAnswered >= r.maxRounds) {
    finishAdventureQuiz();
    return;
  }
  const question = r.queue.shift(); // take next
  const area = document.getElementById('app');
  area.innerHTML = `
    <section class="screen" id="quiz-screen">
      <div class="quiz-topline">
        <span>Chapter: ${QUESTION_BANK[r.subjectKey].chapters.find(c=>c.id===r.chapterId).name}</span>
        <span class="hearts">❤️❤️❤️</span>
      </div>
      <div class="question-card">
        <span class="difficulty-tag ${question.difficulty}">${question.difficulty.toUpperCase()}</span>
        <div class="question-text">${question.q}</div>
        ${question.img ? `<img class="question-img" src="${question.img}" alt="Illustration">` : ''}
        <div class="options-list" id="optionsList"></div>
        <div class="explain-box" id="explainBox"></div>
        <div class="next-btn-wrap" id="nextBtnWrap"></div>
      </div>
    </section>
  `;
  const list = document.getElementById('optionsList');
  const shuffled = question.options.map((text, idx) => ({ text, idx })).sort(() => Math.random() - 0.5);
  shuffled.forEach(({ text, idx }) => {
    const btn = el(`<button class="option-btn" data-original-index="${idx}">
      <span class="opt-letter">${letterFor(list.children.length)}</span><span>${text}</span></button>`);
    btn.addEventListener('click', () => {
      document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
      const isCorrect = idx === question.answer;
      btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if (!isCorrect) {
        const correctBtn = list.querySelector(`[data-original-index="${question.answer}"]`);
        if (correctBtn) correctBtn.classList.add('correct');
      }
      const explainBox = document.getElementById('explainBox');
      explainBox.innerHTML = buildExplainHtml(question, isCorrect);
      explainBox.classList.toggle('wrong-answer', !isCorrect);
      explainBox.classList.add('show');
      document.getElementById('nextBtnWrap').innerHTML = `<button class="btn" id="nextQuestionBtn">
        ${isCorrect ? 'Next →' : 'Try again →'}</button>`;
      // Update rewards
      if (isCorrect) {
        r.coinsEarned += 10;
        r.xpEarned += 5;
        r.correctStreak++;
      } else {
        r.correctStreak = 0;
      }
      r.roundsAnswered++;
      // Store for final scoring
      r.lastResult = { isCorrect, question };
    });
    list.appendChild(btn);
  });
  document.getElementById('nextQuestionBtn')?.addEventListener('click', () => {
    // If correct, we already removed from queue; if incorrect, push back for retry
    const r = quizRuntime;
    if (r.lastResult && !r.lastResult.isCorrect) {
      r.queue.push(r.lastResult.question); // retry later
    }
    renderQuizQuestionAdventure();
  });
}
function buildExplainHtml(question, isCorrect) {
  const correctText = question.options[question.answer];
  if (isCorrect) {
    return `<div class="correct-answer">✅ Correct! ${correctText} is the right answer.</div>`;
  } else {
    return `
      <div class="wrong-answer">❌ You picked <strong>${question.options[quizRuntime.lastSelectedIdx||0]}</strong>.</div>
      <div class="explain-correct">The correct answer is <strong>${correctText}</strong>.</div>
      ${question.explanation ? `<div class="explain-detail">${question.explanation}</div>` : ''}
    `;
  }
}
function finishAdventureQuiz() {
  const r = quizRuntime;
  // Update progress
  const subProg = state.progress[r.subjectKey] || {};
  const chapProg = subProg[r.chapterId] || {};
  const accuracy = r.queue.length === 0 ? 100 : Math.round(((r.roundsAnswered - (r.queue.length?0:0)) / r.roundsAnswered) * 100);
  chapProg.bestAccuracy = Math.max(chapProg.bestAccuracy || 0, accuracy);
  chapProg.stars = Math.min(3, Math.floor(chapProg.bestAccuracy / 50)); // 0-50→0, 50-80→1, 80-100→2/3? We'll do simple
  if (chapProg.bestAccuracy >= 80) chapProg.stars = 2;
  if (chapProg.bestAccuracy >= 95) chapProg.stars = 3;
  subProg[r.chapterId] = chapProg;
  state.progress[r.subjectKey] = subProg;
  state.coins += r.coinsEarned;
  state.xp += r.xpEarned;
  // Streak
  const today = getToday();
  if (state.streak.lastDate !== today) {
    state.streak.count = (state.streak.lastDate === getYesterday()) ? state.streak.count + 1 : 1;
    state.streak.lastDate = today;
  }
  // Badges
  checkAndAwardBadges();
  saveState();
  showResultScreen(`Adventure Complete!`, `You earned ${r.coinsEarned} coins and ${r.xpEarned} XP.`, r.coinsEarned, r.xpEarned);
}
function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate()-1);
  return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}

/* ---------------- Time Challenge (simple) ---------------- */
function startTimeChallenge() {
  const sub = QUESTION_BANK[nav.subject];
  const chapter = sub.chapters.find(c => c.id === nav.chapter);
  quizRuntime = {
    kind: 'time',
    subjectKey: nav.subject,
    chapterId: nav.chapter,
    queue: shuffle(chapter.questions.slice()),
    qIdx: 0,
    correct: 0,
    asked: 0,
    coinsEarned: 0,
    xpEarned: 0,
    timeLeft: 60,
    timerHandle: null
  };
  renderTimeScreen();
  startTimer();
}
function renderTimeScreen() {
  const r = quizRuntime;
  const area = document.getElementById('app');
  area.innerHTML = `
    <section class="screen" id="time-screen">
      <div class="quiz-topline">
        <span>Time: <span id="timerBadge">${r.timeLeft}s</span></span>
        <span>Score: ${r.correct}/${r.asked}</span>
      </div>
      <div class="question-card">
        <div class="question-text">${r.queue[r.qIdx]?.q || ''}</div>
        ${r.queue[r.qIdx]?.img ? `<img class="question-img" src="${r.queue[r.qIdx].img}" alt="">` : ''}
        <div class="options-list" id="optionsList"></div>
        <div class="explain-box" id="explainBox"></div>
      </div>
    </section>
  `;
  if (!r.queue[r.qIdx]) {
    finishTimeChallenge();
    return;
  }
  const list = document.getElementById('optionsList');
  const q = r.queue[r.qIdx];
  const shuffled = q.options.map((text, idx) => ({ text, idx })).sort(() => Math.random() - 0.5);
  shuffled.forEach(({ text, idx }) => {
    const btn = el(`<button class="option-btn" data-original-index="${idx}">
      <span class="opt-letter">${letterFor(list.children.length)}</span><span>${text}</span></button>`);
    btn.addEventListener('click', () => {
      document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
      const isCorrect = idx === q.answer;
      btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if (!isCorrect) {
        const correctBtn = list.querySelector(`[data-original-index="${q.answer}"]`);
        if (correctBtn) correctBtn.classList.add('correct');
      }
      const explainBox = document.getElementById('explainBox');
      explainBox.innerHTML = buildExplainHtml(q, isCorrect);
      explainBox.classList.toggle('wrong-answer', !isCorrect);
      explainBox.classList.add('show');
      r.asked++;
      if (isCorrect) {
        r.correct++;
        r.coinsEarned += 5;
        r.xpEarned += 2;
      }
      setTimeout(() => {
        r.qIdx++;
        renderTimeScreen();
      }, 1500);
    });
    list.appendChild(btn);
  });
}
function startTimer() {
  const r = quizRuntime;
  r.timerHandle = setInterval(() => {
    r.timeLeft--;
    document.getElementById('timerBadge').textContent = `${r.timeLeft}s`;
    if (r.timeLeft <= 0) {
      clearInterval(r.timerHandle);
      finishTimeChallenge();
    }
  }, 1000);
}
function finishTimeChallenge() {
  clearInterval(quizRuntime.timerHandle);
  const r = quizRuntime;
  state.coins += r.coinsEarned;
  state.xp += r.xpEarned;
  saveState();
  showResultScreen(`Time's Up!`, `You scored ${r.correct} correct answers in 60 seconds. Earned ${r.coinsEarned} coins and ${r.xpEarned} XP.`, r.coinsEarned, r.xpEarned);
}

/* ---------------- Placeholder for other modes (Memory, Match, Spin) ---------------- */
function startMemoryMatch() { showNotImplemented('Memory Match'); }
function startMatchFollowing() { showNotImplemented('Match the Following'); }
function startSpinWin() { showNotImplemented('Spin & Win'); }
function showNotImplemented(modeName) {
  const area = document.getElementById('app');
  area.innerHTML = `
    <section class="screen" id="notimpl">
      <h1>${modeName}</h1>
      <p>This mode is coming soon!</p>
      <button class="btn" id="backToMode">← Back</button>
    </section>
  `;
  document.getElementById('backToMode')?.addEventListener('click', renderModeMenu);
}

/* ---------------- Result Screen ---------------- */
function showResultScreen(title, message, coins, xp) {
  const area = document.getElementById('app');
  area.innerHTML = `
    <section class="screen" id="result-screen">
      <h1>${title}</h1>
      <p>${message}</p>
      <div class="rewards">
        <span>🪙 Coins: +${coins}</span>
        <span>✨ XP: +${xp}</span>
      </div>
      <button class="btn" id="playAgain">Play Again</button>
      <button class="btn" id="homeBtn">Home</button>
    </section>
  `;
  document.getElementById('playAgain')?.addEventListener('click', startMode);
  document.getElementById('homeBtn')?.addEventListener('click', renderHome);
}

/* ---------------- Badge System (simple) ---------------- */
function checkAndAwardBadges() {
  // First steps
  if (state.badges.indexOf('first_steps') === -1 && Object.values(state.progress).some(sub => Object.values(sub).some(chap => chap.adventureDone))) {
    state.badges.push('first_steps');
  }
  // Perfectionist (3 stars on any chapter)
  if (state.badges.indexOf('perfectionist') === -1 && Object.values(state.progress).some(sub => Object.values(sub).some(chap => chap.stars === 3))) {
    state.badges.push('perfectionist');
  }
  // Coin collector
  if (state.badges.indexOf('coin_collector') === -1 && state.coins >= 200) {
    state.badges.push('coin_collector');
  }
  // Streak 3
  if (state.badges.indexOf('streak_3') === -1 && state.streak.count >= 3) {
    state.badges.push('streak_3');
  }
  // Subject master (all chapters in a subject 3 stars)
  if (state.badges.indexOf('subject_master') === -1) {
    for (const subKey in QUESTION_BANK) {
      const chapters = QUESTION_BANK[subKey].chapters;
      const allThreeStar = chapters.every(chap => {
        const prog = state.progress[subKey]?.[chap.id];
        return prog && prog.stars === 3;
      });
      if (allThreeStar) {
        state.badges.push('subject_master');
        break;
      }
    }
  }
}

/* ---------------- Init ---------------- */
function init() {
  console.log('init called');
  loadState();
  renderHome();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}