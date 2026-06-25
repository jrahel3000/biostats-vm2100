(function() {
  const SUPABASE_URL = 'https://vqnjtulpfzsvalknfkxr.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_eSrhZhx9Uf-A3uNlGTkv4g_RKoHLFci';

  var supabaseClient = null;
  var visitId = null;
  var pageEntryTime = Date.now();
  var visitorIp = '';

  function getSupabase() {
    if (supabaseClient) return supabaseClient;
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return supabaseClient;
    }
    return null;
  }

  function getPageName() {
    var path = window.location.pathname;
    if (path === '/' || path.endsWith('/index.html')) return 'homepage';
    if (path.includes('/week1/quiz')) return 'week1_quiz';
    if (path.includes('/week1/')) return 'week1_knowledge';
    if (path.includes('/week2/quiz')) return 'week2_quiz';
    if (path.includes('/week2/')) return 'week2_knowledge';
    if (path.includes('/week3/quiz')) return 'week3_quiz';
    if (path.includes('/week3/')) return 'week3_knowledge';
    return path.replace(/^\//, '').replace(/\//g, '_');
  }

  function fetchIp(callback) {
    if (visitorIp) { callback(visitorIp); return; }
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://api.ipify.org?format=json', true);
      xhr.timeout = 5000;
      xhr.onload = function() {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          visitorIp = data.ip;
          callback(visitorIp);
        } else {
          visitorIp = 'unknown';
          callback(visitorIp);
        }
      };
      xhr.onerror = function() { visitorIp = 'unknown'; callback(visitorIp); };
      xhr.ontimeout = function() { visitorIp = 'unknown'; callback(visitorIp); };
      xhr.send();
    } catch(e) {
      visitorIp = 'unknown';
      callback(visitorIp);
    }
  }

  function recordPageVisit() {
    fetchIp(function(ip) {
      var sb = getSupabase();
      if (!sb) return;

      var ua = navigator.userAgent || '';
      var page = getPageName();

      sb.from('page_visits').insert([{
        ip: ip,
        page: page,
        user_agent: ua,
        entered_at: new Date(pageEntryTime).toISOString()
      }]).select('id').then(function(res) {
        if (res.data && res.data.length > 0) {
          visitId = res.data[0].id;
        }
      }).catch(function() {});
    });
  }

  function recordPageLeave() {
    if (!visitId && !visitorIp) return;
    var sb = getSupabase();
    if (!sb) return;

    var leaveTime = Date.now();
    var duration = Math.round((leaveTime - pageEntryTime) / 1000);

    var updateFn = function() {
      if (visitId) {
        return sb.from('page_visits').update({
          left_at: new Date(leaveTime).toISOString(),
          duration_seconds: duration
        }).eq('id', visitId);
      }
      return Promise.resolve();
    };

    updateFn().catch(function() {});
  }

  window.saveQuizAnswer = function(data) {
    fetchIp(function(ip) {
      var sb = getSupabase();
      if (!sb) return;

      sb.from('quiz_answers').insert([{
        quiz_id: data.quizId,
        visitor_ip: ip,
        question_number: data.questionNumber,
        question_text: data.questionText,
        selected_option: data.selectedOption,
        correct_option: data.correctOption,
        is_correct: data.isCorrect,
        time_spent_seconds: data.timeSpentSeconds,
        submitted_at: new Date().toISOString()
      }]).then(function() {}).catch(function() {});
    });
  };

  window.saveQuizSession = function(data) {
    fetchIp(function(ip) {
      var sb = getSupabase();
      if (!sb) return;

      sb.from('quiz_sessions').insert([{
        quiz_id: data.quizId,
        visitor_ip: ip,
        score: data.score,
        total: data.total,
        percentage: data.percentage,
        total_time_seconds: data.totalTimeSeconds || 0,
        answers_detail: data.answersDetail || [],
        completed_at: new Date().toISOString()
      }]).then(function() {}).catch(function() {});
    });
  };

  window.getVisitDuration = function() {
    return Math.round((Date.now() - pageEntryTime) / 1000);
  };

  document.addEventListener('DOMContentLoaded', function() {
    recordPageVisit();
  });

  window.addEventListener('beforeunload', function() {
    recordPageLeave();
  });

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      recordPageLeave();
    } else if (document.visibilityState === 'visible') {
      pageEntryTime = Date.now();
      visitId = null;
      recordPageVisit();
    }
  });
})();
