// A running task must not accidentally unlock controls that were already locked.
export function setBusyControls(dialog, selector, value, remembered, actionKey, available = ['close']) {
  for (const el of dialog.querySelectorAll(selector)) {
    const action = el.dataset[actionKey];
    if (action === 'stop') { el.disabled = !value; continue; }
    if (available.includes(action)) continue;
    if (value) {
      if (!remembered.has(el)) remembered.set(el, el.disabled);
      el.disabled = true;
    } else if (remembered.has(el)) {
      el.disabled = remembered.get(el);
      remembered.delete(el);
    }
  }
  if (!value) remembered.clear();
}
const leavingEditors = new WeakSet();
export function editorIndent(event, onInput) {
  const field = event.target;
  if (event.key === 'Escape') { leavingEditors.add(field); event.preventDefault(); event.stopPropagation(); return; }
  if (event.key !== 'Tab') return;
  if (event.shiftKey || leavingEditors.has(field)) { leavingEditors.delete(field); return; }
  event.preventDefault();
  field.setRangeText('    ', field.selectionStart, field.selectionEnd, 'end');
  onInput(event);
}
