import { icon, sprite } from './art.js';
import { VILLAGE_WIDTH, VILLAGE_HEIGHT, destinations, normalizePosition, findRoute, moveBy, advanceRoute, nearbyDestination, WALK_SPEED } from './village-model.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function villagerSprite(id) {
  if (id === 'rowan') return sprite('rowan', 'village-npc-sprite');
  const mira = '<path fill="#61445d" d="M7 4h11v3h3v10h-5V8H9v9H5V7h2Z"/><path fill="#bd8056" d="M9 8h8v10H9Z"/><path fill="#e4b17f" d="M9 8h7v8H9Z"/><path fill="#443848" d="M10 10h2v2h-2Zm5 0h2v2h-2Z"/><path fill="#e5c469" d="M7 5h12v3H7Z"/><path fill="#6d98a2" d="M6 18h14v6H6Z"/><path fill="#346d78" d="M9 17h7v7H9Z"/><path fill="#e9cba1" d="M11 20h3v2h-3Z"/><path fill="#6c4b37" d="M7 24h4v2H7Zm9 0h4v2h-4Z"/>';
  const elio = '<path fill="#725b90" d="M7 4h12v3h3v7H5V7h2Z"/><path fill="#a495be" d="M7 5h12v3H7Zm-2 5h17v3H5Z"/><path fill="#8f573c" d="M8 13h10v6H8Z"/><path fill="#bd8054" d="M8 13h9v4H8Z"/><path fill="#322d30" d="M9 13h2v2H9Zm5 0h2v2h-2Z"/><path fill="#508b69" d="M5 19h16v5H5Z"/><path fill="#c6b66b" d="M9 18h3v6H9Z"/><path fill="#f1dbab" d="M16 20h7v5h-7Z"/><path fill="#624533" d="M7 24h4v2H7Zm8 0h4v2h-4Z"/>';
  return `<svg class="pet-sprite village-npc-sprite" viewBox="0 0 26 28" role="img" aria-label="${id === 'mira' ? 'Mira the tinkerer' : 'Elio the naturalist'}" shape-rendering="crispEdges">${id === 'mira' ? mira : elio}</svg>`;
}

const adventurer = `<svg class="village-adventurer" viewBox="0 0 30 42" aria-hidden="true" shape-rendering="crispEdges"><ellipse fill="#3d633b45" cx="15" cy="39" rx="13" ry="3"/><g class="village-feet"><path fill="#6d493d" d="M8 29h6v10H6v-3h2Zm9 0h6v10h-8v-3h2Z"/></g><g class="village-adventurer-body"><path fill="#3f6b65" d="M8 5h13v3h4v11h-4v4H8v-4H5V8h3Z"/><path fill="#6ba38a" d="M10 3h10v4h3v4H7V7h3Z"/><path fill="#f1c89a" d="M11 11h11v9h-3v3h-8Z"/><path fill="#413f3a" d="M19 13h2v3h-2Z"/><path fill="#d37e59" d="M9 22h13v10H7V22Z"/><path fill="#f2d7a0" d="M9 22h13v3H9Z"/><path fill="#ac804e" d="M4 19h7v12H4v-3H2v-6h2Z"/><path fill="#d7ab65" d="M4 20h5v7H4Z"/><path fill="#74523d" d="M25 20h2v18h-2Z"/></g></svg>`;

function tree(x, y, scale = 1, color = 0) {
  const palettes = [['#4c8057', '#679a66', '#87b47a'], ['#427c6a', '#629783', '#82b29a'], ['#647f6c', '#859c7a', '#a2b38a'], ['#7c678e', '#9b85a4', '#baa1bc']];
  const [dark, mid, light] = palettes[color];
  return `<g transform="translate(${x} ${y}) scale(${scale})" shape-rendering="crispEdges"><ellipse cx="0" cy="3" rx="25" ry="9" fill="#52754526"/><path d="M-5-36H5V5H-5Z" fill="#94704c"/><path d="M-29-47h8v-15h12v-8h20v8h13v16h8v24h-9v9h-40v-9h-12Z" fill="${dark}"/><path d="M-25-48h8v-13h13v-6h14v8h11v13h7v17H12v7H-8v-8h-17Z" fill="${mid}"/><path d="M-17-51h8v-10H6v6h7v9H-5v8h-12Z" fill="${light}"/><path d="M-2-23h5v16H-2Z" fill="#ab8657"/></g>`;
}
function flower(x, y, color = '#edbb83') {
  return `<g transform="translate(${x} ${y})" shape-rendering="crispEdges"><path d="M0 0h2v9H0Zm-4 4h4v2h-4Z" fill="#6a9459"/><path d="M-2-3h6v6h-6Z" fill="${color}"/><path d="M0-1h2v2H0Z" fill="#fff4bd"/></g>`;
}
function sceneArt(projects) {
  const done = new Set(projects || []);
  const tavernHelp = done.has('project-tavern-bill') || done.has('project-pantry-ledger');
  const games = done.has('project-guessing-game') || done.has('project-festival-scores');
  const garden = done.has('project-plant-adviser');
  const lanterns = done.has('project-lantern-predictor');
  const trees = [[32, 164, 1.2, 0], [37, 260, 1.3, 1], [365, 116, 1.1, 0], [405, 87, 1.0, 1], [582, 80, .95, 2], [618, 116, 1.1, 0], [574, 184, .9, 3], [943, 151, 1.4, 0], [979, 226, 1.25, 1], [944, 275, 1.3, 0], [932, 384, 1.2, 3], [970, 491, 1.4, 0], [924, 580, 1.1, 1], [628, 590, 1.0, 0], [596, 637, 1.2, 1], [359, 600, 1.0, 2], [37, 625, 1.3, 0]];
  return `<svg class="village-landscape" viewBox="0 0 1000 650" fill="none" aria-hidden="true">
    <defs><pattern id="village-grass" width="54" height="48" patternUnits="userSpaceOnUse"><path d="M10 18v-4m4 6v-4m24 23v-4m4 6v-4" stroke="#83ad6e" stroke-width="2" opacity=".36"/></pattern><pattern id="village-roof-tiles" width="32" height="20" patternUnits="userSpaceOnUse"><path d="M0 19h32M16 0v19" stroke="#9d574b" stroke-width="2" opacity=".35"/></pattern></defs>
    <path fill="#a8c987" d="M0 0h1000v650H0Z"/><path fill="url(#village-grass)" d="M0 0h1000v650H0Z"/>
    <path d="M0 28h336v22h98v37h-73v27H0ZM607 0h393v115h-81V85H683V65h-76ZM0 613h124v-18h85v27h118v28H0ZM756 558h244v92H714v-47h42Z" fill="#91b67c"/>
    <path d="M35 348C162 376 259 347 340 367S472 430 550 430 665 372 800 366M500 20V176c0 70-68 80-68 149 0 59 70 96 70 166v159M550 432c47 35 117 71 246 103M460 466c-14 48-56 66-109 66" stroke="#76975d" stroke-width="72" stroke-linecap="round" opacity=".2"/>
    <path d="M35 342C162 370 259 341 340 361S472 424 550 424 665 366 800 360M500 20V176c0 70-68 80-68 149 0 59 70 96 70 166v159M550 426c47 35 117 71 246 103M460 460c-14 48-56 66-109 66" stroke="#d7bd85" stroke-width="63" stroke-linecap="round"/>
    <path d="M35 341C162 369 259 340 340 360S472 423 550 423 665 365 800 359M500 20V176c0 70-68 80-68 149 0 59 70 96 70 166v159M550 425c47 35 117 71 246 103M460 459c-14 48-56 66-109 66" stroke="#ead29d" stroke-width="49" stroke-linecap="round"/>
    <path d="M398 284l8-4m26-63 6-8m78 198 9 1m99-11 8-3M77 349l6 1m261 14 7 2m166 220 1 7m154-96 7 2" stroke="#c6ab78" stroke-width="3" stroke-linecap="round"/>
    <path d="M40 472c7-64 80-91 151-80 68-16 132 33 139 86 23 63-35 115-122 113-67 15-164-20-168-75Z" fill="#7ba76d"/>
    <path d="M49 472c8-55 75-81 141-70 63-16 122 29 130 77 20 56-35 103-112 103-63 14-153-18-159-68Z" fill="#e6d3a0"/>
    <path d="M58 473c10-48 68-72 131-61 58-15 111 26 120 67 17 50-35 93-102 92-60 13-143-15-149-59Z" fill="#69b5bc"/>
    <path d="M69 483c9-42 63-65 121-52 49-15 101 21 108 56 16 42-35 76-92 75-53 12-131-14-137-50Z" fill="#85c7c5"/>
    <g class="village-water-lines" stroke="#c9ebe0" stroke-width="3" stroke-linecap="square"><path d="M94 459h34m-13 5h17m100-6h27m-159 58h40m106 12h30m-101 18h22"/></g>
    <g fill="#719c64"><ellipse cx="117" cy="486" rx="13" ry="5"/><ellipse cx="244" cy="501" rx="12" ry="5"/><ellipse cx="211" cy="445" rx="9" ry="4"/></g><path d="M116 481h6v5h-6Zm126 16h5v5h-5Z" fill="#f2a8a6"/>
    <g shape-rendering="crispEdges"><path d="M274 473h70v34h-70Z" fill="#906945"/><path d="M275 470h69v29h-69Z" fill="#bd955e"/><path d="M285 470v29m12-29v29m12-29v29m12-29v29m12-29v29" stroke="#977247" stroke-width="2"/><path d="M274 466h5v38h-5Zm65 0h5v38h-5Z" fill="#7b6046"/></g>
    <g class="village-tavern" shape-rendering="crispEdges"><path d="M85 302h226v13H85Z" fill="#71975d66"/><path d="M90 177h210v120H90Z" fill="#f0d9a7"/><path d="M91 253h208v45H91Z" fill="#d9b77f"/><path d="M95 180h10v117H95Zm183 0h11v117h-11ZM179 178h11v120h-11ZM90 244h210v9H90Z" fill="#876242"/><path d="M82 170h227v20H82Z" fill="#8d5944"/><path d="M69 178 115 105h153l53 73Z" fill="#bc6b54"/><path d="M78 166 118 106h147l43 60Z" fill="#d88968"/><path d="M78 166 118 106h147l43 60Z" fill="url(#village-roof-tiles)"/><path d="M113 101h155v8H113Z" fill="#9c5e48"/><path d="M233 93h22v40h-22Z" fill="#ad8d76"/><path d="M229 89h30v8h-30Z" fill="#816953"/><path d="M111 202h43v34h-43Zm101 0h43v34h-43Z" fill="#725543"/><path d="M117 207h31v23h-31Zm101 0h31v23h-31Z" fill="#f3c66f"/><path d="M131 205v28m101-28v28M115 219h36m66 0h34" stroke="#b08856" stroke-width="4"/><path d="M148 255h38v43h-38Z" fill="#7c5a41"/><path d="M153 260h28v38h-28Z" fill="#a17c51"/><path d="M173 277h4v4h-4Z" fill="#efd49a"/><path d="M142 297h49v8h-49Z" fill="#b7a17b"/><path d="M208 263h60v25h-60Z" fill="#ba7654"/><path d="M211 259h54v10h-54Z" fill="#769154"/>${[216, 228, 242, 254].map((x, i) => flower(x, 258, i % 2 ? '#eaba70' : '#dc8d84')).join('')}<path d="M123 185h138v14H123Z" fill="#fff0c6"/></g>
    <text x="192" y="195" text-anchor="middle" fill="#7f5840" font-size="8" font-weight="700" letter-spacing="1.25">THE HEARTH &amp; HONEY</text>
    <g class="village-smoke" fill="#f7f0d4" opacity=".65"><rect x="238" y="70" width="12" height="13"/><rect x="246" y="51" width="15" height="14"/><rect x="240" y="34" width="17" height="12"/></g>
    <g shape-rendering="crispEdges"><path d="M671 286h218v14H671Z" fill="#71975d66"/><path d="M680 180h190v105H680Z" fill="#e5cf9c"/><path d="M680 249h190v36H680Z" fill="#c9b382"/><path d="M690 181h9v104h-9Zm155 0h10v104h-10ZM762 181h10v104h-10Z" fill="#807357"/><path d="M661 179 708 105h123l61 74Z" fill="#467e79"/><path d="m674 165 38-59h116l47 59Z" fill="#6ba19a"/><path d="M699 130h150m-162 19h176m-135-41-20 55m43-55-8 55m30-55 8 55m14-55 24 55" stroke="#4c8780" stroke-width="3"/><path d="M710 101h120v7H710Z" fill="#3e7169"/><path d="M704 197h38v36h-38Zm86 0h37v36h-37Z" fill="#586b61"/><path d="M709 202h28v26h-28Zm86 0h27v26h-27Z" fill="#c7dadd"/><path d="M722 201v27m85-27v27M708 215h31m54 0h30" stroke="#738e80" stroke-width="3"/><path d="M754 242h32v43h-32Z" fill="#956c48"/><path d="M779 263h3v3h-3Z" fill="#efd49a"/><path d="M718 180h119v12H718Z" fill="#f5e5bc"/><path d="M810 300h66v10h-66Zm4 10h6v25h-6Zm52 0h6v25h-6Z" fill="#92714e"/><path d="M823 294h15v6h-15Z" fill="#588a8b"/><path d="M842 288h4v13h-4Zm-5 0h15v4h-15Z" fill="#82606c"/></g>
    <text x="778" y="189" text-anchor="middle" fill="#567366" font-size="8" font-weight="700" letter-spacing="1">TINKER’S WORKSHOP</text>
    <g class="village-fountain"><ellipse cx="500" cy="329" rx="47" ry="28" fill="#788b78"/><ellipse cx="500" cy="322" rx="47" ry="28" fill="#c5ccb0"/><ellipse cx="500" cy="320" rx="37" ry="20" fill="#6fadb2"/><ellipse cx="500" cy="317" rx="31" ry="15" fill="#a4d4ca"/><path d="M494 289h12v31h-12Z" fill="#9caa94"/><ellipse cx="500" cy="291" rx="21" ry="10" fill="#d4d6b7"/><ellipse cx="500" cy="289" rx="16" ry="6" fill="#8dc9c6"/><path class="village-water-spout" d="M499 287v-13m-2 3q-14-11-19 11m25-10q14-10 18 11" stroke="#d3ede3" stroke-width="3"/></g>
    <g class="village-garden"><path d="M723 443h147v88H723Z" fill="#95b77b"/><path d="M734 451h125v69H734Z" fill="#bad295"/><path d="M729 465h10v-35h-10Zm29-4h9v-31h-9Zm28-1h9v-30h-9Zm29 1h9v-31h-9Zm29 4h9v-35h-9Z" fill="#f3dfb5"/><path d="M725 441h132v7H725Z" fill="#e1c99f"/><path d="M746 489h32v22h-32Z" fill="#b87d59"/><path d="m741 490 21-23 22 23Z" fill="#bd6b5d"/><path d="M757 494h10v17h-10Z" fill="#785b43"/><path d="M831 487h22v9h-22Z" fill="#b39bc2"/><path d="M833 485h18v6h-18Z" fill="#dbbedb"/><ellipse cx="808" cy="479" rx="10" ry="6" fill="#efd99f"/></g>
    <g shape-rendering="crispEdges"><path d="M449 111h6v44h-6Z" fill="#92734d"/><path d="M429 112h48v17h-48l-9-8Z" fill="#b89561"/><path d="M438 137h34v14h-34l-7-7Z" fill="#d7b67c"/></g>
    <path d="M90 323Q175 373 251 319" stroke="#89704f" stroke-width="2"/><g>${Array.from({ length: 7 }, (_, i) => `<path d="M${106 + i * 21} ${331 + Math.sin(i / 6 * Math.PI) * 13}h12l-6 13Z" fill="${['#d77d68', '#f3d087', '#80a7a0', '#a294b6'][i % 4]}"/>`).join('')}</g>
    ${trees.map(args => tree(...args)).join('')}
    ${Array.from({ length: 54 }, (_, i) => {
      const cluster = [[372, 205], [602, 300], [867, 552], [373, 563], [94, 364], [603, 477]][i % 6];
      return flower(cluster[0] + (i * 17 % 47) - 23, cluster[1] + (i * 23 % 49) - 24, ['#f3cf7c', '#e59d9c', '#b3a0cc', '#faf0cb'][i % 4]);
    }).join('')}
    ${tavernHelp ? `<g class="village-improvement"><path d="M83 300h34v20H83Z" fill="#ab7c4e"/><path d="M80 299h40v7H80Z" fill="#c69760"/>${[85, 96, 108].map(x => `<circle cx="${x}" cy="296" r="6" fill="#c97156"/>`).join('')}<path d="M113 277v17m-8-8h16" stroke="#6c9053" stroke-width="3"/></g>` : ''}
    ${games ? `<g class="village-improvement" shape-rendering="crispEdges"><path d="M590 226h46v8h-46Zm3 8h5v17h-5Zm36 0h5v17h-5Z" fill="#a37951"/><path d="M596 218h10v8h-10Zm16 0h10v8h-10Z" fill="#efc778"/><path d="M599 221h3v3h-3Zm16-1h3v3h-3Z" fill="#bd765a"/><path d="M588 226v-47h3v47Zm48 0v-47h3v47Z" fill="#9a7e57"/><path d="M589 179h49l-8 15h-32Z" fill="#d29eb4"/></g>` : ''}
    ${garden ? `<g class="village-improvement"><path d="M365 447h59v26h-59Z" fill="#a48359"/><path d="M367 450h55v20h-55Z" fill="#80674c"/>${[374, 386, 399, 412].map((x, i) => flower(x, 445, ['#e1a583', '#b99dcc', '#f3d383'][i % 3])).join('')}</g>` : ''}
    ${lanterns ? [390, 455, 548, 619].map((x, i) => `<g class="village-improvement"><path d="M${x} ${550 - i * 22}v-41h18" stroke="#8c7651" stroke-width="3"/><path d="M${x + 12} ${512 - i * 22}h12v16h-12Z" fill="#be8958"/><path class="village-lantern" d="M${x + 15} ${515 - i * 22}h6v10h-6Z" fill="#ffdc85"/></g>`).join('') : ''}
    <g class="village-butterfly" transform="translate(614 397)"><path d="M0 0c-14-13-17 5-2 4-6 11 7 13 5 2C15 9 17-9 3-1Z" fill="#f3bd81"/><path d="M1-2v10" stroke="#97774f" stroke-width="2"/></g>
  </svg>`;
}

export function renderVillage(state, companion = { id: 'pip', name: 'Pip' }) {
  const position = normalizePosition(state.villagePosition);
  const projects = Array.isArray(state.projects) ? state.projects : [];
  const met = new Set(state.metVillagers || []);
  return `<section class="village-shell" aria-labelledby="village-title">
    <div class="village-heading"><div><p class="eyebrow">A LITTLE PLACE TO CALL HOME</p><h1 id="village-title">Welcome to Hearthwick<span>.</span></h1><p>Take the long way. There’s always someone glad to see you.</p></div><span class="village-weather">${icon('spark')} A golden afternoon</span></div>
    <div class="village-frame"><div class="village-topline"><span>${icon('home')} HEARTHWICK VILLAGE</span><span>${projects.length ? `${projects.length} little ${projects.length === 1 ? 'project' : 'projects'}, a happier village` : 'Every good story starts with hello'}</span></div>
    <div class="village-viewport" tabindex="0" role="region" aria-label="Walkable village" aria-describedby="village-instructions">
      <div class="village-scene" style="aspect-ratio:${VILLAGE_WIDTH}/${VILLAGE_HEIGHT}">${sceneArt(projects)}
        ${destinations.map(place => `<button type="button" class="village-destination village-${place.id} ${place.color} ${met.has(place.id) ? 'has-met' : ''}" data-village-walk="${place.id}" style="left:${place.x / 10}%;top:${place.y / 6.5}%" aria-label="Walk to ${esc(place.name)}. ${esc(place.hint)}">${['rowan', 'mira', 'elio'].includes(place.id) ? `<span class="village-npc">${villagerSprite(place.id)}<span class="village-hello" aria-hidden="true">${met.has(place.id) ? '♡' : '!'}</span></span>` : `<span class="village-place-icon">${icon(place.icon)}</span>`}<span class="village-place-name">${esc(place.name)}</span><span class="village-place-hint">${esc(place.place)}</span></button>`).join('')}
        <div class="village-actor" style="left:${position.x / 10}%;top:${position.y / 6.5}%" aria-label="You and ${esc(companion.name)}"><span class="village-you">YOU</span><div class="village-party">${adventurer}<span class="village-following-pet">${sprite(companion.id)}</span></div></div>
        <div class="village-walk-marker" hidden aria-hidden="true"></div>
        <span class="village-map-note" aria-hidden="true">A little curiosity goes a long way.</span>
      </div>
    </div>
    <div class="village-bottomline"><p id="village-instructions">Click to wander <span>·</span> <kbd>WASD</kbd> / <kbd>↑ ↓ ← →</kbd> to walk <span>·</span> <kbd>E</kbd> to chat</p><button type="button" class="village-interact" data-village-interact disabled>Explore the village ${icon('arrow')}</button></div></div>
    <p class="village-status" role="status" aria-live="polite">The kettle is on. Your next adventure can wait a moment.</p>
    <nav class="village-direct" aria-label="Visit a village place directly"><span>Or pop straight over:</span>${destinations.map(place => `<button type="button" data-village-visit="${place.id}">${icon(place.icon)} ${esc(place.name)}</button>`).join('')}</nav>
    ${projects.length ? '<p class="village-growth-note">Your work is becoming part of this place. Look for the little things you’ve helped grow.</p>' : '<p class="village-growth-note">Help your neighbors build things with Python, and watch the village grow with you.</p>'}
  </section>`;
}

export function mountVillage({ state, reducedMotion = false, onVisit = () => {}, onMove = () => {} }) {
  const root = document.querySelector('.village-shell');
  if (!root) return { dispose() {}, pause() {} };
  const viewport = root.querySelector('.village-viewport'), scene = root.querySelector('.village-scene');
  const actor = root.querySelector('.village-actor'), marker = root.querySelector('.village-walk-marker');
  const status = root.querySelector('.village-status'), interact = root.querySelector('[data-village-interact]');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let position = normalizePosition(state.villagePosition), route = [], destination = null, near = null;
  let frame = 0, lastTime = null, disposed = false, dirty = false, pointerDown = null;
  const held = new Set(), listeners = [];
  const listen = (target, name, callback, options) => { target.addEventListener(name, callback, options); listeners.push(() => target.removeEventListener(name, callback, options)); };
  const blocked = () => document.hidden || !!document.querySelector('dialog[open]');
  const commit = () => { if (dirty) { dirty = false; onMove({ x: Math.round(position.x * 10) / 10, y: Math.round(position.y * 10) / 10 }); } };
  const motion = () => root.classList.toggle('village-still', reducedMotion || media.matches);
  const paint = () => {
    actor.style.left = `${position.x / 10}%`; actor.style.top = `${position.y / 6.5}%`;
    const next = nearbyDestination(position);
    if (next?.id !== near?.id) {
      near = next; interact.disabled = !near;
      interact.innerHTML = near ? `${['rowan', 'mira', 'elio'].includes(near.id) ? 'Chat with' : 'Visit'} ${esc(near.name)} ${icon('arrow')}` : `Explore the village ${icon('arrow')}`;
      root.querySelectorAll('[data-village-walk]').forEach(button => button.classList.toggle('nearby', button.dataset.villageWalk === near?.id));
    }
  };
  const stop = () => {
    if (frame) cancelAnimationFrame(frame); frame = 0; lastTime = null;
    route = []; destination = null; held.clear(); marker.hidden = true;
    actor.classList.remove('is-walking'); commit();
  };
  const visit = id => {
    if (disposed || blocked() || !destinations.some(place => place.id === id)) return;
    stop(); status.textContent = `Visiting ${destinations.find(place => place.id === id).name}.`;
    onVisit(id);
  };
  const tick = time => {
    frame = 0;
    if (disposed || blocked()) { stop(); return; }
    const seconds = lastTime == null ? 0 : Math.min(.05, Math.max(0, (time - lastTime) / 1000)); lastTime = time;
    let dx = (held.has('ArrowRight') || held.has('d') ? 1 : 0) - (held.has('ArrowLeft') || held.has('a') ? 1 : 0);
    let dy = (held.has('ArrowDown') || held.has('s') ? 1 : 0) - (held.has('ArrowUp') || held.has('w') ? 1 : 0);
    const old = position;
    if (dx || dy) {
      const scale = WALK_SPEED * seconds / Math.hypot(dx, dy);
      position = moveBy(position, dx * scale, dy * scale);
    } else if (route.length) {
      const result = advanceRoute(position, route, WALK_SPEED * seconds); position = result.position; route = result.route;
    }
    if (position.x !== old.x || position.y !== old.y) {
      dirty = true; actor.classList.toggle('facing-left', position.x < old.x); paint();
      // Keep keyboard travel visible on narrow screens without moving the page.
      if (held.size && viewport.clientWidth < scene.clientWidth) {
        const px = position.x / VILLAGE_WIDTH * scene.clientWidth;
        if (px < viewport.scrollLeft + 70) viewport.scrollLeft = Math.max(0, px - 70);
        if (px > viewport.scrollLeft + viewport.clientWidth - 70) viewport.scrollLeft = px - viewport.clientWidth + 70;
      }
    }
    if (!route.length && !held.size) {
      const arrived = destination; destination = null; marker.hidden = true; actor.classList.remove('is-walking'); lastTime = null; commit();
      if (arrived) visit(arrived.id);
      else if (dirty === false) status.textContent = near ? `${near.name} is nearby. Press E or use the visit button.` : 'A good place to take a breath. Where next?';
      return;
    }
    actor.classList.add('is-walking'); frame = requestAnimationFrame(tick);
  };
  const start = () => { if (!frame && !disposed) { lastTime = null; frame = requestAnimationFrame(tick); } };
  const walk = (target, place = null) => {
    if (disposed || blocked()) return;
    stop(); destination = place;
    route = findRoute(position, target).slice(1);
    if (!route.length) { destination = null; status.textContent = 'That spot is tucked away. Try a nearby path.'; return; }
    marker.style.left = `${route.at(-1).x / 10}%`; marker.style.top = `${route.at(-1).y / 6.5}%`; marker.hidden = false;
    status.textContent = place ? `Walking to ${place.name}…` : 'Off for a little wander…';
    viewport.focus({ preventScroll: true }); start();
  };
  listen(root, 'click', event => {
    const direct = event.target.closest('[data-village-visit]');
    if (direct) { visit(direct.dataset.villageVisit); return; }
    if (event.target.closest('[data-village-interact]')) { if (near) visit(near.id); return; }
    const button = event.target.closest('[data-village-walk]');
    if (button) { const place = destinations.find(item => item.id === button.dataset.villageWalk); walk(place, place); return; }
    if (!event.target.closest('.village-scene')) return;
    // A touch scroll should never become an accidental walk at the end of a drag.
    if (pointerDown && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 8) return;
    const bounds = scene.getBoundingClientRect();
    walk({ x: (event.clientX - bounds.left) / bounds.width * VILLAGE_WIDTH, y: (event.clientY - bounds.top) / bounds.height * VILLAGE_HEIGHT });
  });
  listen(scene, 'pointerdown', event => { pointerDown = { x: event.clientX, y: event.clientY }; });
  listen(root, 'keydown', event => {
    if (blocked() || event.target.closest('input, textarea, select, [contenteditable="true"]') || event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(key)) {
      if (!event.target.closest('.village-viewport')) return;
      event.preventDefault(); route = []; destination = null; marker.hidden = true; held.add(key); start();
    } else if ((key === 'e' || key === 'Enter') && event.target === viewport) { event.preventDefault(); if (near) visit(near.id); }
    else if (key === 'Escape') stop();
  });
  listen(document, 'keyup', event => {
    held.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    if (!held.size && !route.length) stop();
  });
  listen(root, 'focusout', event => { if (!root.contains(event.relatedTarget)) stop(); });
  listen(window, 'blur', stop);
  listen(document, 'visibilitychange', () => { if (document.hidden) stop(); });
  listen(media, 'change', motion);
  motion(); paint();
  if (viewport.clientWidth < scene.clientWidth) viewport.scrollLeft = Math.max(0, position.x / VILLAGE_WIDTH * scene.clientWidth - viewport.clientWidth / 2);
  return {
    pause: stop,
    dispose() { if (disposed) return; disposed = true; stop(); listeners.splice(0).forEach(remove => remove()); }
  };
}
