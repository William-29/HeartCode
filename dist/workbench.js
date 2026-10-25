const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function normalizeWorkbench(value) {
  return { size: Number.isFinite(value?.size) ? Math.max(12, Math.min(22, Math.round(value.size))) : 15, color: value?.color !== false };
}
// Decoration only: the real textarea remains the editable, accessible source.
export function highlightPython(source) {
  const pattern = /#[^\n]*|(?:'''[\s\S]*?(?:'''|$)|"""[\s\S]*?(?:"""|$)|'(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?)|\b(?:def|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|import|from|as|with|try|except|finally|raise|assert|class|pass|break|continue|yield|lambda|del|global|nonlocal)\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g;
  let html = '', offset = 0;
  for (const match of String(source).matchAll(pattern)) {
    html += escape(source.slice(offset, match.index));
    const text = match[0], type = text[0] === '#' ? 'comment' : /['"]/.test(text[0]) ? 'string' : /^\d/.test(text) ? 'number' : 'keyword';
    html += `<span class="python-${type}">${escape(text)}</span>`; offset = match.index + text.length;
  }
  return html + escape(source.slice(offset)) + '\n';
}
export function mountWorkbenches({ read, save, doc = document }) {
  if (!doc.defaultView?.MutationObserver) return {dispose(){}};
  const selector = '#quest-code,#practice-code,#adventure-code,#community-code,#neighbour-code';
  const mounted = new Map();
  function enhance(field) {
    if (mounted.has(field)) return;
    const host = field.closest('dialog') || field.closest('.practice-layout');
    const wrap = doc.createElement('div'); wrap.className = 'warm-workbench';
    field.before(wrap);
    const toolbar = doc.createElement('div'); toolbar.className = 'workbench-tools';
    toolbar.innerHTML = '<span>A little room to think</span><button type="button" data-bench="smaller" aria-label="Smaller code text">A−</button><output aria-label="Code text size"></output><button type="button" data-bench="larger" aria-label="Larger code text">A+</button><button type="button" data-bench="color" aria-pressed="true">Syntax color</button><button type="button" data-bench="focus" aria-pressed="false">Focus view</button>';
    const surface = doc.createElement('div'); surface.className = 'workbench-surface';
    const painted = doc.createElement('pre'); painted.className = 'python-paint'; painted.setAttribute('aria-hidden','true');
    wrap.append(toolbar, surface); surface.append(painted, field);
    field.setAttribute('wrap','off');
    const syncScroll = () => { painted.scrollTop = field.scrollTop; painted.scrollLeft = field.scrollLeft; };
    const update = () => {
      const prefs = normalizeWorkbench(read());
      wrap.style.setProperty('--code-size', `${prefs.size}px`);
      wrap.classList.toggle('syntax-color', prefs.color);
      toolbar.querySelector('output').textContent = `${prefs.size}px`;
      toolbar.querySelector('[data-bench="smaller"]').disabled = prefs.size <= 12;
      toolbar.querySelector('[data-bench="larger"]').disabled = prefs.size >= 22;
      toolbar.querySelector('[data-bench="color"]').setAttribute('aria-pressed', String(prefs.color));
      const focus = !!host?.classList.contains('workbench-focus');
      const focusButton = toolbar.querySelector('[data-bench="focus"]');
      focusButton.textContent = focus ? 'Leave focus view' : 'Focus view'; focusButton.setAttribute('aria-pressed', String(focus));
      const html = highlightPython(field.value);
      if (painted.innerHTML !== html) painted.innerHTML = html;
      syncScroll();
    };
    const click = event => {
      const action = event.target.closest('[data-bench]')?.dataset.bench; if (!action) return;
      if (action === 'focus') { host?.classList.toggle('workbench-focus'); update(); return; }
      const prefs = normalizeWorkbench(read());
      if (action === 'color') prefs.color = !prefs.color;
      else prefs.size += action === 'larger' ? 1 : -1;
      save(normalizeWorkbench(prefs)); mounted.forEach(item=>item.update());
    };
    const close = () => { host?.classList.remove('workbench-focus'); update(); };
    toolbar.addEventListener('click', click); field.addEventListener('input', update); field.addEventListener('keyup', update); field.addEventListener('scroll', syncScroll); host?.addEventListener('close',close);
    mounted.set(field, {update, dispose(){toolbar.removeEventListener('click',click);field.removeEventListener('input',update);field.removeEventListener('keyup',update);field.removeEventListener('scroll',syncScroll);host?.removeEventListener('close',close);host?.classList.remove('workbench-focus');}});
    update();
  }
  function scan() {
    for (const [field,item] of mounted) if (!field.isConnected) {item.dispose();mounted.delete(field);}
    doc.querySelectorAll(selector).forEach(enhance);
  }
  const observer = new doc.defaultView.MutationObserver(records => {
    if (records.some(record => !record.target.closest?.('.warm-workbench'))) scan();
  });
  observer.observe(doc.body,{childList:true,subtree:true});
  // Existing reset controls set .value directly. Refresh after their handlers.
  const refresh = () => queueMicrotask(()=>mounted.forEach(item=>item.update()));
  doc.addEventListener('click',refresh); scan();
  return {dispose(){observer.disconnect();doc.removeEventListener('click',refresh);mounted.forEach(item=>item.dispose());mounted.clear();}};
}
