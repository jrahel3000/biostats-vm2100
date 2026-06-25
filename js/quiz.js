(function() {
  const STATES = { IDLE: 'idle', PRACTICING: 'practicing', ANSWERED: 'answered', COMPLETE: 'complete' };
  let state = STATES.IDLE;
  let currentQuestion = 0;
  let score = 0;
  let selectedOption = -1;
  let questions = [];
  let containerId = '';
  let quizId = '';

  function el(id) { return document.getElementById(id); }

  function updateProgress() {
    const pct = questions.length > 0 ? ((currentQuestion) / questions.length) * 100 : 0;
    const bar = el(containerId + '-progress');
    if (bar) bar.style.width = pct + '%';
    const counter = el(containerId + '-counter');
    if (counter) counter.textContent = 'Question ' + (currentQuestion + 1) + ' of ' + questions.length;
    const scoreEl = el(containerId + '-score');
    if (scoreEl) scoreEl.textContent = 'Score: ' + score + '/' + currentQuestion;
  }

  function renderQuestion() {
    if (currentQuestion >= questions.length) {
      showResults();
      return;
    }

    state = STATES.PRACTICING;
    selectedOption = -1;

    const q = questions[currentQuestion];
    const card = el(containerId + '-question-card');
    card.querySelector('.q-number').textContent = 'Question ' + (currentQuestion + 1);
    card.querySelector('.q-text').innerHTML = q.question;

    const optList = el(containerId + '-options');
    optList.innerHTML = '';
    q.options.forEach(function(opt, idx) {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', function() { selectOption(idx); });
      optList.appendChild(btn);
    });

    const expl = el(containerId + '-explanation');
    expl.className = 'explanation-box';
    expl.innerHTML = '';
    expl.style.display = 'none';

    const submitBtn = el(containerId + '-submit');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Submit Answer';
    submitBtn.disabled = true;
    submitBtn.style.display = 'inline-flex';

    const nextBtn = el(containerId + '-next');
    nextBtn.style.display = 'none';

    updateProgress();

    if (typeof renderMathInElement === 'function') {
      try { renderMathInElement(card); } catch(e) {}
    }
    if (typeof renderMathInElement === 'function') {
      try { renderMathInElement(optList); } catch(e) {}
    }
  }

  function selectOption(idx) {
    if (state !== STATES.PRACTICING) return;
    selectedOption = idx;

    const btns = el(containerId + '-options').querySelectorAll('.option-btn');
    btns.forEach(function(b, i) {
      b.className = 'option-btn' + (i === idx ? ' selected' : '');
    });

    el(containerId + '-submit').disabled = false;
  }

  function submitAnswer() {
    if (state !== STATES.PRACTICING || selectedOption === -1) return;
    state = STATES.ANSWERED;

    const q = questions[currentQuestion];
    const correctIdx = q.correct;
    const isCorrect = selectedOption === correctIdx;

    if (isCorrect) score++;

    const btns = el(containerId + '-options').querySelectorAll('.option-btn');
    btns.forEach(function(b, i) {
      b.disabled = true;
      if (i === correctIdx) {
        b.className = isCorrect ? 'option-btn correct' : 'option-btn revealed-correct';
      } else if (i === selectedOption && !isCorrect) {
        b.className = 'option-btn incorrect';
      }
    });

    const expl = el(containerId + '-explanation');
    expl.className = 'explanation-box show ' + (isCorrect ? 'correct-expl' : 'incorrect-expl');
    expl.innerHTML = (isCorrect
      ? '&#10004; Correct! ' + q.explanation
      : '&#10008; Incorrect. ' + q.explanation);
    expl.style.display = 'block';

    const submitBtn = el(containerId + '-submit');
    submitBtn.style.display = 'none';

    const nextBtn = el(containerId + '-next');
    nextBtn.style.display = 'inline-flex';
    nextBtn.textContent = currentQuestion + 1 >= questions.length ? 'See Results' : 'Next Question';

    const scoreEl = el(containerId + '-score');
    if (scoreEl) scoreEl.textContent = 'Score: ' + score + '/' + (currentQuestion + 1);
  }

  function nextQuestion() {
    if (state !== STATES.ANSWERED) return;
    currentQuestion++;
    if (currentQuestion >= questions.length) {
      showResults();
    } else {
      renderQuestion();
    }
  }

  function showResults() {
    state = STATES.COMPLETE;
    const card = el(containerId + '-question-card');
    const expl = el(containerId + '-explanation');

    const pct = Math.round((score / questions.length) * 100);
    let feedback = '';
    if (pct >= 80) feedback = 'Excellent work! You have a strong grasp of the material.';
    else if (pct >= 60) feedback = 'Good effort. Review the areas where you made mistakes and try again.';
    else feedback = 'Keep studying. Revisit the lecture notes and give it another try.';

    card.innerHTML = '<div class="results-screen">'
      + '<h3>Quiz Complete!</h3>'
      + '<div class="results-score">' + score + '<span style="font-size:1.5rem;color:var(--text-secondary);"> / ' + questions.length + '</span></div>'
      + '<p class="results-label">' + pct + '% correct</p>'
      + '<p class="results-feedback">' + feedback + '</p>'
      + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">'
      + '<button id="' + containerId + '-retry" class="btn btn-retry">Retry Quiz</button>'
      + '</div>'
      + '</div>';

    expl.innerHTML = '';
    expl.style.display = 'none';
    el(containerId + '-submit').style.display = 'none';
    el(containerId + '-next').style.display = 'none';

    el(containerId + '-retry').addEventListener('click', retryQuiz);

    const bar = el(containerId + '-progress');
    if (bar) bar.style.width = '100%';
    const counter = el(containerId + '-counter');
    if (counter) counter.textContent = 'Complete';
  }

  function retryQuiz() {
    currentQuestion = 0;
    score = 0;
    selectedOption = -1;
    state = STATES.IDLE;
    renderQuestion();
  }

  function saveProgress() {
    var data = { quizId: quizId, current: currentQuestion, score: score, answered: currentQuestion };
    try { localStorage.setItem('quiz_' + quizId, JSON.stringify(data)); } catch(e) {}
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem('quiz_' + quizId);
      if (raw) {
        var data = JSON.parse(raw);
        score = data.score || 0;
        if (data.answered > 0 && data.answered <= questions.length) {
          currentQuestion = data.answered;
        }
      }
    } catch(e) {}
  }

  window.initQuiz = function(qData, contId, qId) {
    questions = qData;
    containerId = contId;
    quizId = qId || contId;
    currentQuestion = 0;
    score = 0;
    selectedOption = -1;
    state = STATES.IDLE;

    loadProgress();

    el(containerId + '-submit').addEventListener('click', submitAnswer);
    el(containerId + '-next').addEventListener('click', nextQuestion);

    window.addEventListener('beforeunload', saveProgress);

    var keyHandler = function(e) {
      if (state === STATES.PRACTICING && e.key >= '1' && e.key <= '9') {
        var idx = parseInt(e.key) - 1;
        if (idx < questions[currentQuestion].options.length) selectOption(idx);
      } else if (state === STATES.PRACTICING && selectedOption >= 0 && e.key === 'Enter') {
        submitAnswer();
      } else if (state === STATES.ANSWERED && e.key === 'Enter') {
        nextQuestion();
      }
    };
    document.addEventListener('keydown', keyHandler);

    renderQuestion();
  };
})();
