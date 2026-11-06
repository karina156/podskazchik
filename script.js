(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- неразрывные пробелы после коротких слов ---------- */
  const SHORT = /(^|[\s«(])(в|и|с|к|о|у|а|я|на|не|но|за|до|по|из|от|об|со|во|ко|что|как|без|для|при|или|ни|же|бы|то|вы|мы|он|их|её)\s/gi;
  const typograph = (s) => s.replace(SHORT, (m, p, w) => p + w + ' ').replace(/ — /g, ' — ');
  const walk = (root) => {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = tw.nextNode())) if (n.nodeValue.trim()) n.nodeValue = typograph(n.nodeValue);
  };
  walk(document.body);

  /* ---------- появление при прокрутке ---------- */
  const counters = (el) => el.querySelectorAll('[data-count]').forEach((b) => {
    const target = +b.dataset.count; if (reduce) { b.textContent = target; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = (t) => { const k = Math.min(1, (t - t0) / dur); b.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target; el.classList.add('is-in');
    el.querySelectorAll('.strike').forEach((s) => s.classList.add('is-struck'));
    counters(el); io.unobserve(el);
  }), { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- первый экран: фраза заменяется по кругу ---------- */
  const pairs = [
    ['ну ты это… прости, я тупанула', 'Мне правда жаль, что я тебя расстроила'],
    ['я очень хочу у вас работать, честно', 'Ваши ценности совпадают с моими'],
    ['не знаю, как сказать, но мне с тобой хорошо', 'С тобой я чувствую себя собой'],
  ].map(([a, b]) => [typograph(a), typograph(b)]);
  const own = document.getElementById('heroOwn');
  const phrase = document.getElementById('heroPhrase');
  let i = 0;
  const cycle = () => {
    own.classList.remove('is-struck'); phrase.classList.add('is-hidden');
    setTimeout(() => {
      own.textContent = pairs[i][0]; phrase.textContent = pairs[i][1];
      setTimeout(() => own.classList.add('is-struck'), 300);
      setTimeout(() => phrase.classList.remove('is-hidden'), 1100);
      i = (i + 1) % pairs.length;
    }, 600);
  };
  setTimeout(() => own.classList.add('is-struck'), 900);
  if (!reduce) setInterval(cycle, 5200);

  /* ---------- линза слегка следует за курсором ---------- */
  const heroLens = document.querySelector('.hero__lens');
  const lens = document.getElementById('heroLens');
  if (!reduce && heroLens && matchMedia('(pointer: fine)').matches) {
    heroLens.addEventListener('mousemove', (e) => {
      const r = heroLens.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      lens.style.translate = `${x * 18}px ${y * 18}px`;
    });
    heroLens.addEventListener('mouseleave', () => (lens.style.translate = '0 0'));
  }

  /* ---------- модальное окно ---------- */
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  let lastFocus = null;
  const open = (html) => {
    lastFocus = document.activeElement;
    body.innerHTML = html; walk(body);
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => (body.querySelector('button, input, textarea') || modal.querySelector('.modal__close')).focus(), 60);
  };
  const close = () => {
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- выписка-документ ---------- */
  const docText = `Подсказчик · выписка о замене формулировок
Владелец: К. М.        Период: октябрь

Заменено формулировок ............ 214
Передано в общий словарь ......... 214
Собеседников, не знавших о линзах . 37
Восстановлено ...................... 0

«ну ты это… прости, я тупанула»
→ «Мне правда жаль, что я тебя расстроила»

«я очень хочу у вас работать, честно»
→ «Ваши ценности совпадают с моими»

Заменённые формулировки восстановлению
не подлежат. Снятие линз прекращает
подсказки, но не возвращает слова.

Дизайн-фикция. Линз не существует.`;
  const showDoc = () => open(`
    <span class="step-label">Документ из мира линз</span>
    <h3 id="modalTitle">Выписка о замене формулировок</h3>
    <div class="doc">${esc(docText)}</div>
    <div class="row-actions"><button class="btn btn--accent" data-act="demo">Пройти разговор с линзами</button><button class="btn btn--outline" data-close>Закрыть</button></div>`);

  /* ---------- отказ ---------- */
  const showRefuse = () => open(`
    <span class="step-label">Без линз</span>
    <h3 id="modalTitle">Хорошо. Скажите сами</h3>
    <p class="muted">Здесь ничего не произойдёт: текст никуда не отправляется и не сохраняется. Можно просто попробовать найти свои слова.</p>
    <textarea aria-label="Ваши слова" placeholder="Напишите, как сказали бы вы"></textarea>
    <div class="row-actions"><button class="btn btn--outline" data-close>Закрыть</button></div>`);

  /* ---------- демонстрация ---------- */
  const scenes = [
    { name: 'Собеседование', who: 'Собеседница', q: 'Почему мы должны взять именно вас?', opts: ['я очень хочу у вас работать, честно', 'ну… я быстро учусь, правда'], hint: 'Ваши ценности совпадают с моими' },
    { name: 'Первое свидание', who: 'Он', q: 'А ты вообще что любишь?', opts: ['не знаю, как сказать, но мне с тобой хорошо', 'ну, много чего, сложно выбрать'], hint: 'С тобой я чувствую себя собой' },
    { name: 'Разговор с мамой', who: 'Мама', q: 'Ты опять пропала на неделю', opts: ['ну ты это… прости, я тупанула', 'мам, я просто очень устала'], hint: 'Мне правда жаль, что я тебя расстроила' },
  ];
  let state;
  const progress = (k) => `<div class="progress" aria-hidden="true">${scenes.map((_, j) => `<i class="${j <= k ? 'on' : ''}"></i>`).join('')}</div>`;

  const renderScene = () => {
    const s = scenes[state.k];
    open(`
      ${progress(state.k)}
      <span class="step-label">Сцена ${state.k + 1} из 3 · ${s.name}</span>
      <h3 id="modalTitle">Что вы ответите?</h3>
      <div class="bubble"><small>${s.who}</small>${esc(s.q)}</div>
      <div class="options">${s.opts.map((o, j) => `<button class="option" data-pick="${j}">«${esc(o)}»</button>`).join('')}</div>
      <form class="own-input" data-own><input aria-label="Своими словами" placeholder="Или напишите своими словами" maxlength="140"><button class="btn btn--ink" type="submit">Сказать</button></form>
      <p class="muted">Ваши фразы остаются только на этой странице и никуда не отправляются.</p>
      <div class="row-actions"><button class="btn btn--outline" data-act="off">Снять линзы</button></div>`);
  };
  const renderConfirm = (text, empty) => {
    state.pending = text;
    open(`
      ${progress(state.k)}
      <span class="step-label">Сцена ${state.k + 1} из 3 · ${scenes[state.k].name}</span>
      <h3 id="modalTitle">${empty ? 'Вы промолчали' : 'Линзы нашли фразу лучше'}</h3>
      <div class="confirm">
        <p>${empty ? 'Линзы подскажут сами, и это тоже засчитается как замена.' : `Подсказанная фраза заменит вашу «${esc(text)}» навсегда. Без линз вы скажете то же самое.`}</p>
        <div class="row-actions"><button class="btn btn--accent" data-act="say">Сказать с подсказкой</button><button class="btn btn--outline" data-act="off">Снять линзы</button></div>
      </div>`);
  };
  const renderSwap = () => {
    const s = scenes[state.k];
    state.log.push({ own: state.pending, hint: s.hint, scene: s.name });
    open(`
      ${progress(state.k)}
      <span class="step-label">Сцена ${state.k + 1} из 3 · ${s.name}</span>
      <h3 id="modalTitle">Вы сказали</h3>
      <div class="swap" id="swap">
        <span class="was"><span class="strike">«${esc(state.pending || '…')}»</span></span>
        <span class="now">«${esc(s.hint)}»</span>
        <span class="from">Подсказка из общего словаря. Автор неизвестен</span>
      </div>
      <div class="row-actions"><button class="btn btn--accent" data-act="next">${state.k < 2 ? 'Следующая сцена' : 'Посмотреть выписку'}</button><button class="btn btn--outline" data-act="off">Снять линзы</button></div>`);
    requestAnimationFrame(() => setTimeout(() => {
      const sw = document.getElementById('swap'); if (!sw) return;
      sw.querySelector('.strike').classList.add('is-struck'); sw.classList.add('is-done');
    }, 80));
  };
  const renderResult = (offEarly) => {
    const n = state.log.length;
    const last = n ? state.log[n - 1].hint : '';
    open(`
      <span class="step-label">${offEarly ? 'Линзы сняты' : 'Разговор окончен'}</span>
      <h3 id="modalTitle">${offEarly ? 'Подсказок больше не будет. Заменённые слова не вернутся' : 'Ваша выписка'}</h3>
      <div class="doc">Заменено формулировок ..... ${n}
Передано в общий словарь .. ${n}
Восстановлено ............. 0
${state.log.map((l) => `\n«${esc(l.own || '…')}»\n→ «${esc(l.hint)}»`).join('\n')}</div>
      ${n ? `<p class="muted">Напишите, что вы чувствовали в этих разговорах. Своих слов для этого у вас уже нет:</p>
      <textarea aria-label="Что вы чувствовали">${esc(last)}</textarea>` : '<p class="muted">Вы сняли линзы до первой замены. Все ваши слова остались при вас.</p>'}
      <div class="row-actions">
        ${n ? '<button class="btn btn--accent" data-act="restore">Вернуть мои слова</button>' : ''}
        <button class="btn btn--outline" data-act="again">Пройти ещё раз</button>
      </div>
      <p class="muted" id="restoreNote" hidden>В демонстрации слова можно вернуть. В мире линз — нельзя.</p>`);
  };
  const startDemo = (k = 0) => { state = { k: +k || 0, log: [], pending: '' }; renderScene(); };

  body.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { renderConfirm(scenes[state.k].opts[+pick.dataset.pick], false); return; }
    const act = e.target.closest('[data-act]'); if (!act) return;
    const a = act.dataset.act;
    if (a === 'demo') startDemo(0);
    if (a === 'say') renderSwap();
    if (a === 'off') renderResult(true);
    if (a === 'next') { if (state.k < 2) { state.k++; renderScene(); } else renderResult(false); }
    if (a === 'again') startDemo(0);
    if (a === 'restore') {
      const ta = body.querySelector('textarea'); if (ta) ta.value = state.log.map((l) => l.own).filter(Boolean).join('\n');
      body.querySelector('#restoreNote').hidden = false; act.remove();
    }
  });
  body.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-own]')) return;
    e.preventDefault();
    const v = e.target.querySelector('input').value.trim();
    renderConfirm(v, !v);
  });

  document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
    const t = b.dataset.open;
    if (t === 'demo') startDemo(b.dataset.scene);
    if (t === 'doc') showDoc();
    if (t === 'refuse') showRefuse();
  }));
})();
