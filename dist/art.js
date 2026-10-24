const paths = {
  home: '<path d="m3 10 9-7 9 7v10H4V10m5 10v-7h6v7"/>',
  map: '<path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2zm6-2v15m6-12v15"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
  paw: '<ellipse cx="6" cy="7" rx="2" ry="3"/><ellipse cx="18" cy="7" rx="2" ry="3"/><ellipse cx="2.5" cy="12" rx="1.5" ry="2.5"/><ellipse cx="21.5" cy="12" rx="1.5" ry="2.5"/><path d="M6 18c0-7 12-7 12 0 0 5-4 2-6 2s-6 3-6-2Z"/>',
  trophy: '<path d="M7 3h10v7a5 5 0 0 1-10 0zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 3v5m-5 1h10"/>',
  flame: '<path d="M13 2c2 7-5 8-3 12 2 0 4-2 5-5 5 4 6 7 3 11-3 4-11 3-13-2C2 12 8 9 8 6c1 2 2 3 3 4 2-2 2-5 2-8Z"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm7 0v4m-2-2h4"/>',
  flask: '<path d="M9 2h6m-5 0v7L4 19q-1 3 3 3h10q4 0 3-3L14 9V2M7 15h10m-7 3h1m3-1h1"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  network: '<circle cx="12" cy="4" r="2"/><circle cx="4" cy="19" r="2"/><circle cx="20" cy="19" r="2"/><circle cx="12" cy="13" r="2"/><path d="M12 6v5m-1 4-5 3m7-3 5 3M5 17 11 6m2 0 6 11"/>',
  coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="M12 8v8"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  book: '<path d="M12 5c-3-2-7-2-10 0v15c3-2 7-2 10 0 3-2 7-2 10 0V5c-3-2-7-2-10 0Zm0 0v15"/>',
  settings: '<path d="m9 3 6 0 1 3 3 1 2 5-2 4-3 1-1 4H9l-1-4-3-1-2-4 2-5 3-1Z"/><circle cx="12" cy="12" r="3"/>',
  sound: '<path d="M3 9h4l5-5v16l-5-5H3zm13-2c3 3 3 7 0 10m3-13c5 5 5 11 0 16"/>',
  mute: '<path d="M3 9h4l5-5v16l-5-5H3zm13 0 5 6m0-6-5 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  stop: '<rect x="5" y="5" width="14" height="14"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 8c0-4 7-3 6 1 0 2-3 2-3 5m0 3v1"/>',
  reset: '<path d="M4 10a8 8 0 1 1 0 6m0-6V4m0 6h6"/>',
  leaf: '<path d="M4 20C-1 5 12 1 21 3c1 12-6 20-17 17Zm0 0L17 7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>'
};
export function icon(name, className = '') { return `<svg class="icon ${className}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`; }

const art = {
  moss: '<path fill="#426b48" d="M8 6h3V3h3v3h4v2h3v3h2v5H3v-5h2V8h3Z"/><path fill="#87a965" d="M7 9h12v2h2v3H5v-3h2Z"/><path fill="#dce2ab" d="M7 10h3v2H7Zm9 1h3v2h-3Z"/><path fill="#b79965" d="M8 16h11v6h-3v2h-3v-2h-3v2H7v-5h1Z"/><path fill="#e6d5a5" d="M10 16h7v5h-7Z"/><path fill="#394438" d="M10 17h2v2h-2Zm5 0h2v2h-2Z"/><path fill="#c18361" d="M12 20h3v1h-3Z"/><path fill="#c2d485" d="M13 3V1h4v2h-2v2h-2Z"/>',
  bramble: '<path fill="#88522c" d="M3 15V9h3V6h3V4h3l2 3 3-2 2 4h3v5h2v6h-3v3H6v-2H3Z"/><path fill="#c58b42" d="M5 11h3V8h5v3h5v3h3v5H5Z"/><path fill="#e5b267" d="M6 12h3v3H6Zm5-4h2v3h-2Zm5 6h3v3h-3Z"/><path fill="#ecd0a0" d="M11 15h8v2h4v4H11Z"/><path fill="#a87947" d="M7 21h4v3H7Zm10 0h4v3h-4Z"/><path fill="#3c3027" d="M15 16h2v2h-2Zm7 2h2v2h-2Z"/><path fill="#6c8152" d="M9 5V2h4v2h-2v3Z"/>',
  clover: '<path fill="#6d6980" d="M3 5h5l4 5h2l4-5h5v9h-2v7h-6l-2-3-2 3H5v-7H3Z"/><path fill="#b2b7a1" d="M5 7h3l4 5v4l-3-2H5Zm10 5 4-5h2v7h-3l-3 2Z"/><path fill="#dcdcb5" d="M5 8h3v3H5Zm13 0h3v3h-3ZM6 16h4v3H6Zm10 0h4v3h-4Z"/><path fill="#b4a282" d="M11 10h4v10h-4Z"/><path fill="#efd394" d="M10 7h6v5h-6Z"/><path fill="#40374a" d="M10 8h2v2h-2Zm4 0h2v2h-2Z"/><path fill="#c5b28d" d="M9 4h2v3H9Zm6 0h2v3h-2Z"/>',
  pip: '<path fill="#ad602e" d="M5 5h5v4h5V5h5v14h-2v4h-3v-3H9v3H6v-4H4v-5H2v-4h2v4h2V9H5Z"/><path fill="#e6a65e" d="M7 7h2v4h7V7h2v9h-2v3H8v-3H6v-5h1Zm0 12h3v3H7Zm7 0h3v3h-3Z"/><path fill="#f7d39a" d="M9 14h6v3H9Zm1 5h4v2h-4Z"/><path fill="#28251e" d="M8 12h2v2H8Zm7 0h2v2h-2Zm-4 4h2v1h-2Z"/><path fill="#b17870" d="M7 8h1v2H7Zm10 0h1v2h-1Z"/>',
  fern: '<path fill="#48794b" d="M5 11h3V8h9v3h3v4h2v6h-3v2H5v-2H2v-6h3Z"/><path fill="#8eb767" d="M6 12h3v-2h7v2h3v5h1v3H5v-3h1Z"/><path fill="#b7d989" d="M8 12h3v2H8Zm-1 3h2v3H7Z"/><path fill="#293e2d" d="M9 17h2v2H9Zm6 0h2v2h-2Zm-4 3h4v1h-4Z"/><path fill="#5b8b4a" d="M12 8V4H9V2h4v2h4v2h-3v2Z"/>',
  ember: '<path fill="#a54e2a" d="M3 3h4l4 5h3l4-5h3v12h-2v5h-4v3H9v-3H6v-5H3Z"/><path fill="#e08c45" d="M5 6h2v3h3v2h5V9h3V6h1v9h-3v5H9v-5H5Zm13 12h3v-6h2v9h-6Z"/><path fill="#f6d9a9" d="M5 12h4v2h6v-2h4v3h-3v3H9v-3H5Zm5 8h4v3h-4Zm11-8h2v4h-2Z"/><path fill="#372922" d="M7 11h2v2H7Zm8 0h2v2h-2Zm-4 5h3v2h-3Z"/>',
  sage: '<path fill="#56656c" d="M4 5h4v2h8V5h4v13h-2v3h-4v2h-4v-2H6v-3H4Z"/><path fill="#90a4a0" d="M6 9h12v10h-2v2H8v-2H6Z"/><path fill="#e6d8b3" d="M6 10h5v5H6Zm7 0h5v5h-5Zm-4 7h6v3H9Z"/><path fill="#202e32" d="M8 11h2v3H8Zm6 0h2v3h-2Z"/><path fill="#e3b054" d="M11 14h2v3h-2Zm-3 7h2v2H8Zm6 0h2v2h-2Z"/><path fill="#6b8284" d="M2 14h3v6H2Zm17 0h3v6h-3Z"/>',
  nova: '<path fill="#65557e" d="M7 3h3v3h5V3h3v6h2v8h-3v5h-3v-2H9v2H6v-6H4v-4H2V8h3v3h2Zm12 14h3v-4h2v8h-6Z"/><path fill="#a58bba" d="M9 8h7v3h2v5h-3v4H9v-5H7v-3h2Z"/><path fill="#d9c3cc" d="M10 16h5v4h-5Z"/><path fill="#edb76c" d="M8 2h2v4H8Zm7 0h2v4h-2Zm-4 5h3v2h-3Z"/><path fill="#302b3e" d="M10 11h2v2h-2Zm5 0h2v2h-2Z"/><path fill="#b89ec7" d="M2 9h2v2H2Zm19 5h2v3h-2Z"/>',
  rowan: '<path fill="#8f6440" d="M6 5h3V3h7v2h3v8H6Z"/><path fill="#e0b88c" d="M8 7h9v8H8Z"/><path fill="#f0d0a5" d="M7 12h11v4h-2v2h-7v-2H7Z"/><path fill="#d1d3bd" d="M7 11h3v3h5v-3h3v5h-2v3H9v-3H7Z"/><path fill="#4c6c57" d="M6 18h13v5H6Z"/><path fill="#b78d58" d="M10 19h5v4h-5Z"/><path fill="#332922" d="M9 9h2v2H9Zm5 0h2v2h-2Z"/>'
};
export function sprite(id = 'pip', className = '') { return `<svg class="pet-sprite ${className}" viewBox="0 0 26 26" role="img" aria-label="${id === 'rowan' ? 'Rowan the innkeeper' : id + ' pixel companion'}" shape-rendering="crispEdges">${art[id] || art.pip}</svg>`; }
