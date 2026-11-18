/* Saakshi Legal Studio: vanilla JS, no libraries */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- BCI banner ---------- */
  var bci = $('#bci');
  var seen = false;
  try { seen = localStorage.getItem('saakshi-bci') === '1'; } catch (e) {}
  if (!seen) bci.hidden = false;
  $('#bci-ok').addEventListener('click', function () {
    try { localStorage.setItem('saakshi-bci', '1'); } catch (e) {}
    bci.hidden = true;
  });

  /* ---------- Mobile menu ---------- */
  var toggle = $('#nav-toggle');
  toggle.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  $$('#nav-links a').forEach(function (a) {
    a.addEventListener('click', function () { document.body.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); });
  });

  /* ---------- Scroll progress ring on the nav button ---------- */
  var ring = $('#progress-ring');
  var CIRC = 100.5;
  function progress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    ring.style.strokeDashoffset = (CIRC * (1 - p)).toFixed(1);
  }
  window.addEventListener('scroll', progress, { passive: true });
  progress();

  /* ---------- Scroll reveal: rise from perspective ---------- */
  var risers = $$('.rise');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        // stagger siblings that enter together
        var group = el.parentNode ? $$('.rise', el.parentNode).filter(function (x) { return x.parentNode === el.parentNode; }) : [el];
        var idx = Math.max(0, group.indexOf(el));
        el.style.transitionDelay = Math.min(idx * 0.08, 0.4) + 's';
        el.classList.add('in');
        el.addEventListener('transitionend', function clear(ev) {
          if (ev.propertyName !== 'transform') return;
          el.style.transitionDelay = '';
          el.classList.add('settled');
          el.removeEventListener('transitionend', clear);
        });
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    risers.forEach(function (el) { io.observe(el); });
  } else {
    risers.forEach(function (el) { el.classList.add('in', 'settled'); });
  }

  /* ---------- Expanding situation panels ---------- */
  var panels = $$('.panel');
  function openPanel(p) {
    panels.forEach(function (x) { x.classList.toggle('is-open', x === p); x.setAttribute('aria-expanded', x === p ? 'true' : 'false'); });
  }
  panels.forEach(function (p) {
    p.addEventListener('click', function () { openPanel(p); });
    if (fine) p.addEventListener('mouseenter', function () { openPanel(p); });
  });

  /* ---------- Legal check-up quiz ---------- */
  var answers = [null, null, null, null];
  var bar = $('#score-bar'), num = $('#score-num'), msg = $('#score-msg'), cta = $('#score-cta');
  var RING = 527.8, shown = 0;
  var MESSAGES = [
    'Your papers need attention. Most families are in the same place, and each gap takes a single meeting to fix.',
    'A few important gaps. Start with the will and the title documents, as those cause the longest delays later.',
    'Halfway there. A short review would close the remaining gaps in a week or two.',
    'Nearly covered. One more document and your family is well protected.',
    'Well covered. A review every two years, or after any big life change, keeps it that way.'
  ];
  function animateNumber(to) {
    if (reduce) { num.textContent = to; shown = to; return; }
    var from = shown, start = null;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min(1, (ts - start) / 600);
      num.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step); else shown = to;
    }
    requestAnimationFrame(step);
  }
  $$('.yn button').forEach(function (b) {
    b.addEventListener('click', function () {
      var q = +b.dataset.q;
      answers[q] = +b.dataset.v;
      $$('.yn button[data-q="' + q + '"]').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      var answered = answers.filter(function (a) { return a !== null; }).length;
      var score = answers.reduce(function (s, a) { return s + (a || 0); }, 0);
      bar.style.strokeDashoffset = (RING * (1 - score / 4)).toFixed(1);
      animateNumber(score);
      if (answered === 4) { msg.textContent = MESSAGES[score]; cta.hidden = score === 4; }
      else { msg.textContent = (4 - answered) + (4 - answered === 1 ? ' question' : ' questions') + ' left.'; }
    });
  });

  /* ---------- 3D tilt + spotlight on service cards ---------- */
  if (fine && !reduce) {
    $$('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        if (!card.classList.contains('settled')) return;
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (x * 100) + '%');
        card.style.setProperty('--my', (y * 100) + '%');
        card.style.transition = 'transform .12s ease-out';
        card.style.transform = 'perspective(900px) rotateY(' + ((x - .5) * 10) + 'deg) rotateX(' + ((.5 - y) * 10) + 'deg) translateZ(6px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform .7s cubic-bezier(.34,1.56,.64,1)';
        card.style.transform = '';
      });
    });
  }

  /* ---------- Drag / button carousel ---------- */
  var car = $('#carousel'), dots = $$('#dots i');
  var stepW = function () { var s = $('.step', car); return s ? s.getBoundingClientRect().width + 18 : 400; };
  $('#next').addEventListener('click', function () { car.scrollBy({ left: stepW(), behavior: reduce ? 'auto' : 'smooth' }); });
  $('#prev').addEventListener('click', function () { car.scrollBy({ left: -stepW(), behavior: reduce ? 'auto' : 'smooth' }); });
  car.addEventListener('scroll', function () {
    var i = Math.round(car.scrollLeft / stepW());
    dots.forEach(function (d, k) { d.classList.toggle('is-on', k === Math.min(i, dots.length - 1)); });
  }, { passive: true });
  if (fine) {
    var down = false, sx = 0, sl = 0, moved = false;
    car.addEventListener('pointerdown', function (e) { down = true; moved = false; sx = e.clientX; sl = car.scrollLeft; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; car.classList.add('dragging'); }
      car.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      car.classList.remove('dragging');
      if (moved) { var i = Math.round(car.scrollLeft / stepW()); car.scrollTo({ left: i * stepW(), behavior: 'smooth' }); }
    });
  }
  car.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); $('#next').click(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); $('#prev').click(); }
  });

  /* ---------- Chat FAQ ---------- */
  var FAQ = [
    ['Is the first call really free?', 'Yes. The first 20 minutes are free, on video, phone or at our office. If you need paid work, we send a written fixed quote before anything starts.'],
    ['Can you help if I live outside India?', 'Yes, about a third of our clients are NRIs. We handle powers of attorney, property sales and succession, and arrange consulate attestation or apostille where needed.'],
    ['How long does a rental agreement take?', 'Usually one working day. Registered leave and licence agreements in Maharashtra can be done online with biometric verification at your door.'],
    ['Do you go to court?', 'Yes. Tanvi leads our disputes work in consumer commissions, RERA and civil courts in Pune and Mumbai. Most matters settle after a well-drafted notice.'],
    ['How do I pay?', 'UPI, bank transfer or card. We take 50 percent to start and the rest on delivery. Government fees are paid directly, with receipts.']
  ];
  var qs = $('#chat-qs'), log = $('#chat-log'), busy = false;
  function addBubble(cls, text) {
    var b = document.createElement('div');
    b.className = 'bubble ' + cls;
    if (text) b.textContent = text;
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }
  FAQ.forEach(function (f) {
    var btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = f[0]; btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () {
      if (busy) return;
      busy = true;
      $$('button', qs).forEach(function (b) { b.setAttribute('aria-pressed', b === btn); });
      addBubble('bubble--me', f[0]);
      var typing = addBubble('bubble--them bubble--typing');
      typing.innerHTML = '<i></i><i></i><i></i>';
      typing.setAttribute('aria-label', 'Typing');
      setTimeout(function () {
        typing.remove();
        var reply = addBubble('bubble--them', '');
        if (reduce) { reply.textContent = f[1]; busy = false; return; }
        var i = 0;
        (function type() {
          i += 3;
          reply.textContent = f[1].slice(0, i);
          log.scrollTop = log.scrollHeight;
          if (i < f[1].length) setTimeout(type, 16); else busy = false;
        })();
      }, reduce ? 0 : 750);
    });
    qs.appendChild(btn);
  });

  /* ---------- Booking widget ---------- */
  var daysEl = $('#days');
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var firstOpen = null;
  for (var d = 0; d < 10; d++) {
    var dt = new Date(); dt.setDate(dt.getDate() + d);
    var closed = dt.getDay() === 0; // closed on Sundays
    var label = document.createElement('label');
    var value = DOW[dt.getDay()] + ', ' + dt.getDate() + ' ' + MON[dt.getMonth()];
    label.innerHTML = '<input type="radio" name="day" value="' + value + '"' + (closed ? ' disabled' : '') + '><span>' + (d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : DOW[dt.getDay()]) + '<b>' + dt.getDate() + '</b>' + (closed ? 'Closed' : MON[dt.getMonth()]) + '</span>';
    daysEl.appendChild(label);
    if (!closed && firstOpen === null) { firstOpen = label.querySelector('input'); }
  }
  // today: default to tomorrow if it is late in the day
  var now = new Date();
  var dayInputs = $$('input[name="day"]', daysEl).filter(function (i) { return !i.disabled; });
  (now.getHours() >= 17 && dayInputs[1] ? dayInputs[1] : dayInputs[0]).checked = true;

  var form = $('#booking'), err = $('#booking-err'), done = $('#booking-done');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var name = (fd.get('name') || '').trim(), phone = (fd.get('phone') || '').trim();
    if (!fd.get('time')) { err.textContent = 'Pick a time for your call.'; return; }
    if (name.length < 2) { err.textContent = 'Enter your name so the lawyer knows who to ask for.'; form.elements.name.focus(); return; }
    if (!/^(\+?\d{1,3}[\s-]?)?\d{10}$/.test(phone.replace(/\s/g, ''))) { err.textContent = 'Enter a 10-digit WhatsApp number, with country code if outside India.'; form.elements.phone.focus(); return; }
    err.textContent = '';
    $('#booking-summary').textContent = fd.get('mode') + ' on ' + fd.get('day') + ' at ' + fd.get('time') + '. We will confirm on WhatsApp at ' + phone + ' within two working hours, ' + name.split(' ')[0] + '.';
    form.hidden = true; done.hidden = false;
    $('#booking-again').focus();
  });
  $('#booking-again').addEventListener('click', function () { form.reset(); dayInputs[0].checked = true; done.hidden = true; form.hidden = false; });
})();
