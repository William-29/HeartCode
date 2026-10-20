import { roomPosition, normalizeLayout, wallpapers } from './cozy-model.js';
import { normalizeHome, roomSlots } from './village-life-model.js';

export function mountRoomEditor({ state, selectedSlot = 'chair', onSave = () => {}, root = document.querySelector('.home-scene'), drawer = document.querySelector('#room-decor') }) {
  if (!root || !drawer) return { dispose() {} };
  state.home = normalizeHome(state.home);
  const buttons = [...root.querySelectorAll('[data-room-object]')];
  const status = drawer.querySelector('.room-position-status');
  let selected = selectedSlot, drag = null, disposed = false;
  const listeners = [];
  const listen = (node, type, fn) => { node.addEventListener(type, fn); listeners.push(() => node.removeEventListener(type, fn)); };
  const paint = (slot, point) => {
    const button = buttons.find(button => button.dataset.roomObject === slot);
    if (!button) return;
    button.style.left = `${point.x}%`; button.style.top = `${point.y}%`; button.style.transform = `rotate(${point.rotation}deg)`;
  };
  const announce = () => {
    if (!status) return;
    const point = state.home.layout[selected];
    status.textContent = state.home.placed[selected] ? `${roomSlots[selected]} selected. ${Math.round(point.x)}% across, ${Math.round(point.y)}% down, rotated ${point.rotation}°. Saved.` : `${roomSlots[selected]} is empty. Place a furnishing first.`;
    drawer.querySelectorAll('[data-room-edit]').forEach(button => { button.disabled = button.dataset.roomEdit !== 'reset' && !state.home.placed[selected]; });
  };
  const select = slot => { selected = slot; buttons.forEach(button => button.classList.toggle('furniture-selected', button.dataset.roomObject === slot)); announce(); };
  const cancel = () => { if (!drag) return; const previous = drag; drag = null; paint(previous.slot, previous.origin); if (previous.button.hasPointerCapture?.(previous.id)) previous.button.releasePointerCapture(previous.id); };
  const commit = (slot, value) => { state.home.layout[slot] = roomPosition(slot, value); paint(slot, state.home.layout[slot]); onSave(); announce(); };
  const toggle = () => { if (!drawer.open) cancel(); root.classList.toggle('room-editing', drawer.open); buttons.forEach(button => button.disabled = !drawer.open); };
  listen(drawer, 'toggle', toggle);
  listen(root, 'pointerdown', event => {
    const button = event.target.closest('[data-room-object]');
    if (!drawer.open || !button || event.button !== 0 || drag) return;
    const slot = button.dataset.roomObject, bounds = root.getBoundingClientRect();
    if (!state.home.placed[slot] || !bounds.width || !bounds.height) return;
    event.preventDefault(); select(slot); button.focus({ preventScroll: true });
    drag = { slot, button, id: event.pointerId, x: event.clientX, y: event.clientY, bounds, origin: { ...state.home.layout[slot] }, preview: { ...state.home.layout[slot] } };
    button.setPointerCapture(event.pointerId);
  });
  listen(root, 'pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    drag.preview = roomPosition(drag.slot, { ...drag.origin, x: drag.origin.x + (event.clientX - drag.x) / drag.bounds.width * 100, y: drag.origin.y + (event.clientY - drag.y) / drag.bounds.height * 100 });
    paint(drag.slot, drag.preview);
  });
  listen(root, 'pointerup', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const done = drag; drag = null; commit(done.slot, done.preview);
    if (done.button.hasPointerCapture?.(done.id)) done.button.releasePointerCapture(done.id);
  });
  listen(root, 'pointercancel', cancel); listen(root, 'lostpointercapture', cancel);
  listen(root, 'focusin', event => { const slot = event.target.closest('[data-room-object]')?.dataset.roomObject; if (slot) select(slot); });
  const adjust = (action, amount = 1) => {
    if (action === 'reset') { cancel(); state.home.layout = normalizeLayout(); for (const [slot, point] of Object.entries(state.home.layout)) paint(slot, point); onSave(); announce(); return; }
    if (!state.home.placed[selected]) return;
    const point = { ...state.home.layout[selected] };
    if (action === 'left') point.x -= amount; else if (action === 'right') point.x += amount;
    else if (action === 'up') point.y -= amount; else if (action === 'down') point.y += amount;
    else if (action === 'rotate-left') point.rotation -= 15; else if (action === 'rotate-right') point.rotation += 15; else return;
    commit(selected, point);
  };
  listen(root, 'keydown', event => {
    if (event.key === 'Escape') { cancel(); return; }
    const slot = event.target.closest('[data-room-object]')?.dataset.roomObject;
    if (!drawer.open || !slot) return;
    const action = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', r: 'rotate-right', R: 'rotate-left' }[event.key];
    if (action) { event.preventDefault(); select(slot); adjust(action, event.shiftKey ? 4 : 1); }
  });
  listen(drawer, 'click', event => { const action = event.target.closest('[data-room-edit]')?.dataset.roomEdit; if (action) adjust(action); });
  listen(drawer, 'change', event => {
    if (event.target.id !== 'room-wallpaper' || !Object.hasOwn(wallpapers, event.target.value)) return;
    state.home.wallpaper = event.target.value; root.dataset.wallpaper = event.target.value; onSave();
  });
  listen(window, 'blur', cancel);
  toggle(); select(selected);
  return { dispose() { if (disposed) return; disposed = true; cancel(); listeners.splice(0).forEach(remove => remove()); } };
}
