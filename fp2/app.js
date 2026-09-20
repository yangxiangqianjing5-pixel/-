// FP2級 対策アプリ ロジック(バニラJS、外部ライブラリ不使用)

let state = null; // {key, label, list, index, score, wrongIds, mode}

function $(id){ return document.getElementById(id); }

function subjectByKey(key){
  return SUBJECTS.find(s => s.key === key);
}

function setSubjectColor(key){
  const s = subjectByKey(key);
  const color = s ? s.color : "#1e293b";
  const dark = s ? s.colorDark : "#0f172a";
  document.documentElement.style.setProperty("--subj-color", color);
  document.documentElement.style.setProperty("--subj-dark", dark);
}

/* ---------- localStorage(端末内だけの自己ベスト記録) ---------- */
function bestKey(key){ return "fp2_best_" + key; }
function loadBest(key){
  try {
    const raw = localStorage.getItem(bestKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
}
function saveBestIfBetter(key, correct, total){
  try {
    const cur = loadBest(key);
    if (!cur || correct > cur.correct) {
      localStorage.setItem(bestKey(key), JSON.stringify({correct, total}));
    }
  } catch(e){ /* プライベートモード等でも動作継続 */ }
}

/* ---------- ホーム画面 ---------- */
function renderHome(){
  showScreen("home");
  const grid = $("subjectGrid");
  grid.innerHTML = "";
  SUBJECTS.forEach(s => {
    const count = QUIZ_DATA.filter(q => q.subject === s.key).length;
    const best = loadBest(s.key);
    const btn = document.createElement("button");
    btn.className = "subject-card";
    btn.style.background = `linear-gradient(135deg, ${s.color}, ${s.colorDark})`;
    btn.innerHTML = `
      <span class="emoji">${s.emoji}</span>
      <span class="name">${s.short}</span>
      <span class="meta">全${count}問</span>
      ${best ? `<span class="best">自己ベスト ${best.correct}/${best.total}</span>` : ""}
    `;
    btn.addEventListener("click", () => startQuiz(s.key));
    grid.appendChild(btn);
  });

  const bestAll = loadBest("all");
  $("fullmockBest").textContent = bestAll ? `自己ベスト ${bestAll.correct}/${bestAll.total}` : "本試験1回分(60問)に挑戦";
}

/* ---------- クイズ開始 ---------- */
function startQuiz(key){
  const list = QUIZ_DATA.filter(q => q.subject === key).slice().sort((a,b)=>a.id-b.id);
  const s = subjectByKey(key);
  state = { key, label: s.name, list, index: 0, score: 0, wrongIds: [], mode: "subject" };
  setSubjectColor(key);
  showScreen("quiz");
  renderQuestion();
}

function startFullMock(){
  const list = QUIZ_DATA.slice().sort((a,b)=>a.id-b.id);
  state = { key: "all", label: "本試験1回分(60問)", list, index: 0, score: 0, wrongIds: [], mode: "all" };
  setSubjectColor(list[0].subject);
  showScreen("quiz");
  renderQuestion();
}

function startReview(ids, label){
  const list = QUIZ_DATA.filter(q => ids.includes(q.id)).slice().sort((a,b)=>a.id-b.id);
  state = { key: "review", label: label, list, index: 0, score: 0, wrongIds: [], mode: "review" };
  setSubjectColor(list[0].subject);
  showScreen("quiz");
  renderQuestion();
}

/* ---------- クイズ画面 ---------- */
function renderQuestion(){
  const q = state.list[state.index];
  if (state.mode === "all" || state.mode === "review") setSubjectColor(q.subject);

  $("quizSubjectName").textContent = subjectByKey(q.subject).emoji + " " + state.label;
  $("quizProgressText").textContent = `${state.index + 1} / ${state.list.length}`;
  $("progressFill").style.width = ((state.index) / state.list.length * 100) + "%";

  $("qNumber").textContent = "問題 " + (state.index + 1);
  $("qText").textContent = q.question;

  const choicesEl = $("choicesArea");
  choicesEl.innerHTML = "";
  q.choices.forEach((choice, i) => {
    const b = document.createElement("button");
    b.className = "choice-btn";
    b.innerHTML = `<span class="num">${i+1}</span>${choice}`;
    b.addEventListener("click", () => selectAnswer(i));
    choicesEl.appendChild(b);
  });

  $("feedbackArea").innerHTML = "";
  $("nextBtnWrap").innerHTML = "";
}

function selectAnswer(choiceIndex){
  const q = state.list[state.index];
  const buttons = document.querySelectorAll("#choicesArea .choice-btn");
  buttons.forEach(b => b.disabled = true);

  const isCorrect = choiceIndex === q.correct;
  buttons[q.correct].classList.add("correct");
  if (!isCorrect) {
    buttons[choiceIndex].classList.add("wrong");
  }

  if (isCorrect) {
    state.score++;
  } else {
    state.wrongIds.push(q.id);
  }

  const fb = document.createElement("div");
  fb.className = "feedback " + (isCorrect ? "correct-fb" : "wrong-fb");
  fb.innerHTML = `
    <div class="fb-title">${isCorrect ? "⭕ 正解です!" : "❌ 不正解 — 正解は " + (q.correct+1) + " です"}</div>
    <div class="explain-box">
      <div class="sec point">
        <span class="lbl">論点</span>
        <p>${q.point}</p>
      </div>
      <div class="sec steps">
        <span class="lbl">解き方</span>
        <ul>${q.steps.map(s => `<li>${s}</li>`).join("")}</ul>
      </div>
      <div class="sec pitfall">
        <span class="lbl">ひっかけポイント</span>
        <p>${q.pitfall}</p>
      </div>
      <div class="sec tip">
        <span class="lbl">覚え方のコツ</span>
        <p>${q.tip}</p>
      </div>
    </div>
  `;
  $("feedbackArea").innerHTML = "";
  $("feedbackArea").appendChild(fb);

  const isLast = state.index === state.list.length - 1;
  const nextBtn = document.createElement("button");
  nextBtn.className = "next-btn";
  nextBtn.textContent = isLast ? "結果を見る →" : "次の問題へ →";
  nextBtn.addEventListener("click", () => {
    if (isLast) {
      finishQuiz();
    } else {
      state.index++;
      renderQuestion();
      window.scrollTo({top:0, behavior:"smooth"});
    }
  });
  $("nextBtnWrap").innerHTML = "";
  $("nextBtnWrap").appendChild(nextBtn);
}

/* ---------- 結果画面 ---------- */
function finishQuiz(){
  showScreen("result");
  const total = state.list.length;
  const score = state.score;
  const pct = Math.round(score / total * 100);

  if (state.mode === "subject") saveBestIfBetter(state.key, score, total);
  if (state.mode === "all") saveBestIfBetter("all", score, total);

  let emoji = "🌱";
  let msg = "焦らず、テキストで復習してから再チャレンジしましょう。";
  if (pct === 100) { emoji = "🏆"; msg = "満点です!この調子で他の科目も挑戦しましょう。"; }
  else if (pct >= 80) { emoji = "🎉"; msg = "合格ライン突破レベルです!間違えた問題だけ確認しておきましょう。"; }
  else if (pct >= 60) { emoji = "😊"; msg = "あと少し!間違えた問題を中心に復習しましょう。"; }

  $("resultEmoji").textContent = emoji;
  $("resultTitle").textContent = state.label + " の結果";
  $("resultScore").innerHTML = `${score} <span>/ ${total} 問正解(${pct}%)</span>`;
  $("resultMsg").textContent = msg;

  const breakdown = $("resultBreakdown");
  breakdown.innerHTML = "";
  if (state.mode === "all") {
    SUBJECTS.forEach(s => {
      const qs = state.list.filter(q => q.subject === s.key);
      const wrongInSubj = qs.filter(q => state.wrongIds.includes(q.id)).length;
      const correctInSubj = qs.length - wrongInSubj;
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.style.background = s.color;
      chip.textContent = `${s.emoji} ${s.short} ${correctInSubj}/${qs.length}`;
      breakdown.appendChild(chip);
    });
  }

  const actions = $("resultActions");
  actions.innerHTML = "";

  const retryBtn = document.createElement("button");
  retryBtn.className = "primary";
  retryBtn.textContent = "もう一度挑戦する";
  retryBtn.addEventListener("click", () => {
    if (state.mode === "all") startFullMock();
    else if (state.mode === "subject") startQuiz(state.key);
    else renderQuestion0Again();
  });
  actions.appendChild(retryBtn);

  if (state.wrongIds.length > 0) {
    const reviewBtn = document.createElement("button");
    reviewBtn.className = "secondary";
    reviewBtn.textContent = `間違えた${state.wrongIds.length}問だけ復習する`;
    reviewBtn.addEventListener("click", () => startReview(state.wrongIds, "復習(" + state.label + ")"));
    actions.appendChild(reviewBtn);
  }

  const homeBtn = document.createElement("button");
  homeBtn.className = "ghost";
  homeBtn.textContent = "科目選択に戻る";
  homeBtn.addEventListener("click", renderHome);
  actions.appendChild(homeBtn);
}

function renderQuestion0Again(){
  state.index = 0; state.score = 0; state.wrongIds = [];
  showScreen("quiz");
  renderQuestion();
}

/* ---------- 画面切り替え ---------- */
function showScreen(name){
  ["home","quiz","result"].forEach(n => {
    $("screen-" + n).style.display = (n === name) ? "block" : "none";
  });
  window.scrollTo({top:0, behavior:"auto"});
}

/* ---------- 初期化 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  $("fullmockBtn").addEventListener("click", startFullMock);
  renderHome();
});
