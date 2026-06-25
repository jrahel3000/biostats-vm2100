(function() {
  var STATES = { IDLE: 'idle', PRACTICING: 'practicing', ANSWERED: 'answered', COMPLETE: 'complete' };
  var state = STATES.IDLE;
  var currentQuestion = 0;
  var score = 0;
  var selectedOption = -1;
  var questions = [];
  var containerId = '';
  var quizId = '';

  var questionStartTime = 0;
  var quizStartTime = 0;
  var answersLog = [];

  var EMAILJS_SERVICE_ID = 'service_1h8y3xz';
  var EMAILJS_TEMPLATE_ID = 'template_mhf6nhg';
  var EMAILJS_PUBLIC_KEY = 'wvtazevdBeENT2H0n';

  function el(id) { return document.getElementById(id); }

  function updateProgress() {
    var pct = questions.length > 0 ? ((currentQuestion) / questions.length) * 100 : 0;
    var bar = el(containerId + '-progress');
    if (bar) bar.style.width = pct + '%';
    var counter = el(containerId + '-counter');
    if (counter) counter.textContent = 'Question ' + (currentQuestion + 1) + ' of ' + questions.length;
    var scoreEl = el(containerId + '-score');
    if (scoreEl) scoreEl.textContent = 'Score: ' + score + '/' + currentQuestion;
  }

  function renderMathSafe(el) {
    if (typeof renderMathInElement === 'function') {
      try { renderMathInElement(el); } catch(e) {}
    }
  }

  function renderQuestion() {
    if (currentQuestion >= questions.length) {
      showResults();
      return;
    }

    state = STATES.PRACTICING;
    selectedOption = -1;
    questionStartTime = Date.now();

    var q = questions[currentQuestion];
    var card = el(containerId + '-question-card');
    card.querySelector('.q-number').textContent = 'Question ' + (currentQuestion + 1);
    card.querySelector('.q-text').innerHTML = q.question;

    var optList = el(containerId + '-options');
    optList.innerHTML = '';
    q.options.forEach(function(opt, idx) {
      var btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', function() { selectOption(idx); });
      optList.appendChild(btn);
    });

    var expl = el(containerId + '-explanation');
    expl.className = 'explanation-box';
    expl.innerHTML = '';
    expl.style.display = 'none';

    var submitBtn = el(containerId + '-submit');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Submit Answer';
    submitBtn.disabled = true;
    submitBtn.style.display = 'inline-flex';

    var nextBtn = el(containerId + '-next');
    nextBtn.style.display = 'none';

    updateProgress();
    renderMathSafe(card);
    renderMathSafe(optList);
  }

  function selectOption(idx) {
    if (state !== STATES.PRACTICING) return;
    selectedOption = idx;

    var btns = el(containerId + '-options').querySelectorAll('.option-btn');
    btns.forEach(function(b, i) {
      b.className = 'option-btn' + (i === idx ? ' selected' : '');
    });

    el(containerId + '-submit').disabled = false;
  }

  function submitAnswer() {
    if (state !== STATES.PRACTICING || selectedOption === -1) return;
    state = STATES.ANSWERED;

    var timeSpent = parseFloat(((Date.now() - questionStartTime) / 1000).toFixed(1));
    var q = questions[currentQuestion];
    var correctIdx = q.correct;
    var isCorrect = selectedOption === correctIdx;

    if (isCorrect) score++;

    var btns = el(containerId + '-options').querySelectorAll('.option-btn');
    btns.forEach(function(b, i) {
      b.disabled = true;
      if (i === correctIdx) {
        b.className = isCorrect ? 'option-btn correct' : 'option-btn revealed-correct';
      } else if (i === selectedOption && !isCorrect) {
        b.className = 'option-btn incorrect';
      }
    });

    var expl = el(containerId + '-explanation');
    expl.className = 'explanation-box show ' + (isCorrect ? 'correct-expl' : 'incorrect-expl');
    expl.innerHTML = (isCorrect
      ? '&#10004; Correct! ' + q.explanation
      : '&#10008; Incorrect. ' + q.explanation);
    expl.style.display = 'block';

    el(containerId + '-submit').style.display = 'none';

    var nextBtn = el(containerId + '-next');
    nextBtn.style.display = 'inline-flex';
    nextBtn.textContent = currentQuestion + 1 >= questions.length ? 'See Results' : 'Next Question';

    var scoreEl = el(containerId + '-score');
    if (scoreEl) scoreEl.textContent = 'Score: ' + score + '/' + (currentQuestion + 1);

    var answerEntry = {
      quizId: quizId,
      questionNumber: currentQuestion + 1,
      questionText: q.question.replace(/<[^>]*>/g, '').substring(0, 200),
      selectedOption: q.options[selectedOption],
      correctOption: q.options[correctIdx],
      isCorrect: isCorrect,
      timeSpentSeconds: timeSpent
    };
    answersLog.push(answerEntry);

    if (typeof saveQuizAnswer === 'function') {
      saveQuizAnswer(answerEntry);
    }
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
    var card = el(containerId + '-question-card');

    var pct = Math.round((score / questions.length) * 100);
    var totalSeconds = Math.round((Date.now() - quizStartTime) / 1000);
    var duration = typeof getVisitDuration === 'function' ? getVisitDuration() : totalSeconds;
    var min = Math.floor(duration / 60);
    var sec = duration % 60;
    var timeStr = min > 0 ? min + 'm ' + sec + 's' : sec + 's';

    var feedback = '';
    if (pct >= 80) feedback = 'Excellent work! You have a strong grasp of the material.';
    else if (pct >= 60) feedback = 'Good effort. Review the areas where you made mistakes and try again.';
    else feedback = 'Keep studying. Revisit the lecture notes and give it another try.';

    card.innerHTML =
      '<div class="results-screen">'
      + '<h3>Quiz Complete!</h3>'
      + '<div class="results-score">' + score
      + '<span style="font-size:1.5rem;color:var(--text-secondary);"> / ' + questions.length + '</span></div>'
      + '<p class="results-label">' + pct + '% correct &middot; Time: ' + timeStr + '</p>'
      + '<p class="results-feedback">' + feedback + '</p>'
      + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">'
      + '<button id="' + containerId + '-retry" class="btn btn-retry">Retry Quiz</button>'
      + '</div>'
      + '</div>';

    var expl = el(containerId + '-explanation');
    expl.innerHTML = '';
    expl.style.display = 'none';
    el(containerId + '-submit').style.display = 'none';
    el(containerId + '-next').style.display = 'none';

    el(containerId + '-retry').addEventListener('click', retryQuiz);

    var bar = el(containerId + '-progress');
    if (bar) bar.style.width = '100%';
    var counter = el(containerId + '-counter');
    if (counter) counter.textContent = 'Complete';

    var sessionData = {
      quizId: quizId,
      score: score,
      total: questions.length,
      percentage: pct,
      totalTimeSeconds: duration,
      answersDetail: answersLog
    };

    if (typeof saveQuizSession === 'function') {
      saveQuizSession(sessionData);
    }

    sendEmailNotification(sessionData);
  }

  function retryQuiz() {
    currentQuestion = 0;
    score = 0;
    selectedOption = -1;
    answersLog = [];
    quizStartTime = Date.now();
    state = STATES.IDLE;
    renderQuestion();
  }

  function sendEmailNotification(data) {
    if (EMAILJS_PUBLIC_KEY === 'PUBLIC_KEY_PLACEHOLDER') return;

    if (typeof emailjs === 'undefined') {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      s.onload = function() {
        emailjs.init(EMAILJS_PUBLIC_KEY);
        doSendEmail(data);
      };
      document.head.appendChild(s);
      return;
    }

    if (!emailjs._initialized) {
      try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e) {}
    }
    doSendEmail(data);
  }

  function doSendEmail(data) {
    var quizNames = { week1: 'Week 1 — Foundation', week2: 'Week 2 — Data Exploration', week3: 'Week 3 — Hypothesis Testing' };
    var quizName = quizNames[data.quizId] || data.quizId;

    var totalSec = data.totalTimeSeconds;
    var min = Math.floor(totalSec / 60);
    var sec = totalSec % 60;
    var timeStr = min > 0 ? min + 'm ' + sec + 's' : sec + 's';

    var allDetails = data.answersDetail.map(function(a) {
      return 'Q' + a.questionNumber + ': ' + a.questionText.substring(0, 60)
        + ' → ' + (a.isCorrect ? 'CORRECT' : 'WRONG')
        + ' (' + a.timeSpentSeconds + 's)';
    }).join('\n  ');

    try {
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        quiz_name: quizName,
        user_ip: 'see supabase dashboard',
        score: data.score,
        total: data.total,
        percentage: data.percentage + '%',
        total_time: timeStr,
        duration: timeStr,
        completed_at: new Date().toLocaleString(),
        all_details: allDetails
      }).then(function() {
        console.log('[VM2100] Email notification sent');
      }).catch(function(e) {
        console.log('[VM2100] Email send error: ' + (e.text || e.message || 'unknown'));
      });
    } catch(e) {
      console.log('[VM2100] Email send failed: ' + e);
    }
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
    answersLog = [];
    quizStartTime = Date.now();
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
