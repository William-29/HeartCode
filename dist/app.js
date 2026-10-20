import { chapters, quests, pets, achievements, dailyQuestions } from './content.js';
import { freshState, normalizeState, SAVE_KEY, dateKey, isUnlocked, nextQuest, levelInfo, visibleStreak, completeQuest, completeDaily, adoptPet, meetVillager, completeProject } from './state.js';
import { icon, sprite } from './art.js';
import { runPython, cancelRun } from './runner.js';
import { renderWorld, mountWorld } from './world.js';
import { travelForCompletion } from './world-model.js';
import { bunting, teaCup, garden, rewardChest } from './cozy-art.js';
import { showCelebration } from './celebration.js';
import { renderVillage, mountVillage } from './village.js';
import { projects, villagers, projectUnlocked } from './projects.js';
import { renderVillager, renderProjectDemo, demoSource } from './village-stories.js';
import { characterPortrait } from './characters.js';
import { renderRoom, renderFestival, renderCafe, mountVillageClock } from './village-life.js';
import { furnishRoom, removeFurnishing, celebrateFestival, periods } from './village-life-model.js';

const $ = (selector, root = document) => root.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
let state = freshState();
let saveWarning = '';
try { const stored = localStorage.getItem(SAVE_KEY); if (stored) state = normalizeState(JSON.parse(stored)); }
catch { saveWarning = 'Your saved adventure could not be loaded. This session starts fresh; use Settings to restore an exported save.'; }
let route = location.hash.slice(1) || 'village';
let mapSelection = null;
let roomSlot = 'chair';
let worldSession = null;
let villageSession = null;
let villageClock = null;
let activeDemo = null;
let activeGame = null;
let pendingTravel = null;
let journeyReceipt = null;
let activeQuest = null;
let selectedAnswer = null;
let solved = false;
let saveTimer;
let audioContext;
let celebration = null;
const routes = { village: ['Village', 'leaf'], tavern: ['Tavern', 'home'], quests: ['Quest map', 'map'], practice: ['Practice room', 'code'], companions: ['Companions', 'paw'], achievements: ['Achievements', 'trophy'], room: ['Your room', 'home'], festival: ['Festival', 'spark'] };
const questDialog = $('#quest-dialog');
const settingsDialog = $('#settings-dialog');
const villageDialog = $('#village-dialog');

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); saveWarning = ''; }
  catch { saveWarning = 'Your browser could not save progress. Export your adventure in Settings before closing.'; toast(saveWarning, 'help', 8000); }
}
function saveDraft(key, text) { state.drafts[key] = text.slice(0, 30000); clearTimeout(saveTimer); saveTimer = setTimeout(save, 350); }
window.addEventListener('pagehide', () => { villageSession?.pause(); clearTimeout(saveTimer); save(); });
function toast(message, symbol = 'spark', duration = 4200) {
  const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = `${icon(symbol)}<span>${esc(message)}</span>`;
  $('#toasts').append(el); setTimeout(() => el.remove(), duration);
}
function chime() {
  if (!state.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.connect(gain); gain.connect(audioContext.destination);
      const start = audioContext.currentTime + index * 0.12;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.045, start + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
      oscillator.start(start); oscillator.stop(start + 0.46);
    });
  } catch { /* Sound is optional; progress never depends on audio. */ }
}
function notifyAchievements(items) { items.forEach((a, i) => setTimeout(() => toast(`Achievement unlocked: ${a.name} · +${a.coins} coins`, 'trophy', 6000), 500 + i * 500)); }
function progressBar(percent, className = '') { return `<div class="progress ${className}" role="progressbar" aria-label="Progress" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div>`; }
function rewardLine(xp, coins) { return `<span class="reward-xp">${icon('spark')} ${xp} XP</span><span class="reward-coins">${icon('coin')} ${coins} coins</span>`; }
function pet() { return pets.find(p => p.id === state.equipped) || pets[0]; }
function celebrate(options, parent = document.body) {
  celebration?.dispose();
  celebration = showCelebration({ companion: pet().id, name: pet().name, ...options }, { parent, reducedMotion: state.reducedMotion });
}
function navigate(next) { if (!routes[next]) next = 'tavern'; if (route === next) { render(); return; } location.hash = next; }
window.addEventListener('hashchange', () => { cancelRun(); route = location.hash.slice(1); render(); $('#main').focus({ preventScroll: true }); window.scrollTo(0, 0); });

function render() {
  const previousPlaces = villageSession?.places?.();
  celebration?.dispose();
  celebration = null;
  worldSession?.dispose();
  worldSession = null;
  villageSession?.dispose();
  villageSession = null;
  villageClock?.dispose();
  villageClock = null;
  if (!routes[route]) route = 'tavern';
  document.documentElement.classList.toggle('reduce-motion', state.reducedMotion);
  const level = levelInfo(state.xp);
  const current = pet();
  $('#app').innerHTML = `
    <aside class="sidebar">
      <a class="brand" href="#village" aria-label="Hearthcode village"><img src="assets/favicon.svg" alt="" width="39" height="39"><span>Hearthcode<small>THE LEARNING TAVERN</small></span></a>
      <div class="sidebar-label">YOUR ADVENTURE</div>
      <nav aria-label="Main navigation">${Object.entries(routes).map(([key, [label, symbol]]) => `<a href="#${key}" aria-label="${label}" class="nav-link ${route === key ? 'active' : ''}" ${route === key ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${label}</span>${key === 'companions' ? `<span class="nav-count">${state.owned.length}</span>` : ''}${key === 'achievements' && state.achievements.length ? `<span class="nav-count">${state.achievements.length}</span>` : ''}</a>`).join('')}</nav>
      <div class="side-note">${teaCup()}<p>There’s always time<br>for one more try.</p><span>THE KETTLE’S ON</span></div>
      <div class="sidebar-bottom">
        <button class="quiet-button settings-link" data-action="settings">${icon('settings')} Settings & saved progress</button>
        <div class="player-card"><div class="avatar">${characterPortrait("traveler", "player-portrait")}</div><div><strong>${esc(state.name)}</strong><span>Level ${level.level} · ${level.level < 4 ? 'Curious apprentice' : level.level < 7 ? 'Tavern scholar' : 'Guild adventurer'}</span></div></div>
        <div class="small-row"><span>To the next level</span><span>${level.current} / ${level.needed} XP</span></div>${progressBar(level.percent)}
      </div>
    </aside>
    <div class="workspace" data-route="${route}">
      <header class="topbar"><div class="breadcrumb">The learning tavern <span>/</span> <strong>${routes[route][0]}</strong></div><div class="top-stats"><span class="stat-pill" title="Consecutive days with a completed quest or daily challenge">${icon('flame')}<b>${visibleStreak(state)}</b><span>day streak</span></span><span class="stat-pill coin-pill" title="Spend coins on companions and room furnishings">${icon('coin')}<b>${state.coins.toLocaleString()}</b></span><span class="stat-pill xp-pill">${icon('spark')}<b>${state.xp.toLocaleString()}</b><span>XP</span></span><button class="icon-button" data-action="settings" aria-label="Settings and saved progress">${icon('settings')}</button><button class="icon-button sound-toggle" data-action="sound" aria-label="${state.sound ? 'Turn reward sounds off' : 'Turn reward sounds on'}" aria-pressed="${state.sound}" title="Reward sounds ${state.sound ? 'on' : 'off'}">${icon(state.sound ? 'sound' : 'mute')}</button></div></header>
      <main id="main" tabindex="-1">${saveWarning ? `<div class="notice">${icon('help')}${esc(saveWarning)}</div>` : ''}${({ village: () => renderVillage(state, pet()), tavern: renderTavern, quests: renderQuests, practice: renderPractice, companions: renderCompanions, achievements: renderAchievements, room: () => renderRoom(state, pet(), roomSlot), festival: () => renderFestival(state) })[route]()}</main>
      <footer class="footer"><span>${icon('flame')} A little learning. A little magic.</span><button class="footer-settings" data-action="settings" aria-label="Settings and saved progress">${icon('settings')} Settings & saved progress</button><span>${saveWarning ? 'Export a backup in Settings' : 'Progress saved in this browser'} <span class="save-dot"></span></span></footer>
    </div>`;
  if (route === 'practice') bindEditor($('#practice-code'), 'practice');
  if (route === 'village') villageSession = mountVillage({ state, previousPlaces, reducedMotion: state.reducedMotion, onVisit: visitVillage, onMove: position => { state.villagePosition = position; clearTimeout(saveTimer); saveTimer = setTimeout(save, 350); } });
  if (route === 'village') villageClock = mountVillageClock(state, render);
  if (route === 'quests') {
    const travel = pendingTravel;
    pendingTravel = null;
    worldSession = mountWorld({ state, selectedIndex: mapSelection, travel, reducedMotion: state.reducedMotion, onSelect: index => { mapSelection = index; } });
  }
}

function renderTavern() {
  const next = nextQuest(state), current = pet(), level = levelInfo(state.xp);
  const chapter = next ? chapters[next.chapter] : chapters.at(-1);
  const dailyDone = state.daily.includes(dateKey());
  const chapterStart = Math.min(Math.max(0, chapter.id - 1), chapters.length - 3);
  return `<div class="page-heading tavern-heading"><div><p class="eyebrow">${state.completed.length ? 'YOUR SEAT IS SAVED' : 'WELCOME TO HEARTHCODE'}</p><h1>Good to have you here, ${esc(state.name)}.</h1></div><div class="open-sign"><span></span> COME AS YOU ARE</div></div>
    <section class="tavern-welcome">
      <div class="welcome-copy"><span class="welcome-kicker">${icon('leaf')} A little learning, at your pace</span><h2>${!state.completed.length ? 'Come on in.<br>Let’s learn something.' : next ? 'A fresh page.<br>A new discovery.' : 'Look how far<br>you’ve wandered.'}</h2><p>${next ? 'Python, AI, and machine learning make more sense one small discovery at a time. We’ll figure it out together.' : `You’ve completed all ${quests.length} quests. There’s still room at the workbench for your next idea.`}</p><button class="button primary" data-action="${next ? 'quest' : 'navigate'}" data-id="${next?.id || ''}" data-route="practice">${icon(next ? 'play' : 'code')} ${state.completed.length === 0 ? 'Let’s begin' : next ? 'Pick up where you left off' : 'Make something of your own'} ${icon('arrow')}</button><span class="welcome-time">${icon('clock')} ${next ? `About ${next.minutes} minutes · ${chapter.difficulty}` : 'No rush. Stay a while.'}</span></div>
      <div class="welcome-illustration">${bunting()}<div class="tavern-window"><img src="assets/tavern.png" width="1536" height="1024" alt="A welcoming tavern with a glowing fireplace, books, and a comfortable armchair"><span class="window-glow"></span></div><span class="window-sill"></span><div class="welcome-friend">${sprite(current.id, 'floating-pet')}<span>${current.name} saved you a spot.</span></div><span class="welcome-flower flower-left" aria-hidden="true">✿</span><span class="welcome-flower flower-right" aria-hidden="true">✿</span></div>
    </section>
    <div class="village-invitation">${icon('leaf')}<p><strong>There’s a whole village outside.</strong>Meet your neighbours, build something useful, and make a friend along the way.</p><button class="button outline" data-action="navigate" data-route="village">Take a stroll ${icon('arrow')}</button></div>
    <div class="journey-stats"><div>${icon('book')}<span><strong>${state.completed.length}<small> / ${quests.length}</small></strong><span>Discoveries made</span></span></div><div>${icon('spark')}<span><strong>Level ${level.level}</strong><span>${level.current} / ${level.needed} XP</span></span></div><div>${icon('paw')}<span><strong>${state.owned.length}<small> / ${pets.length}</small></strong><span>Friends for the journey</span></span></div></div>
    <div class="dashboard-grid"><div class="dashboard-main">
      <section class="next-section"><div class="section-heading"><h2>On your reading table</h2><span class="eyebrow">ONE THING AT A TIME</span></div>${next ? `<button class="next-quest-card" data-action="quest" data-id="${next.id}"><span class="quest-book">${icon(next.type === 'code' ? 'code' : 'book')}</span><span class="next-quest-text"><span class="eyebrow">QUEST ${String(quests.indexOf(next) + 1).padStart(2, '0')} · ${next.type === 'code' ? 'TRY SOME PYTHON' : 'THINK IT THROUGH'}</span><strong>${next.title}</strong><span>${next.subtitle}</span></span><span class="quest-card-reward">${rewardLine(next.xp, next.coins)}</span><span class="circle-arrow">${icon('arrow')}</span></button>` : `<div class="notice success">${icon('trophy')} All ${quests.length} quests complete. That’s something to be proud of.</div>`}</section>
      <section class="chapter-trail"><div class="section-heading"><h2>Around the next bend</h2><button class="text-button" data-action="navigate" data-route="quests">Unfold the map ${icon('arrow')}</button></div><div class="chapter-preview-grid">${chapters.slice(chapterStart, chapterStart + 3).map(ch => chapterCard(ch)).join('')}</div></section>
      <section class="innkeeper-note"><div>${characterPortrait('rowan', 'note-portrait')}<span><strong>A note from Rowan</strong><small>YOUR FRIEND AT THE TAVERN</small></span></div><p>“Getting stuck is part of it. Take a breath, try one small change, and see what happens. The kettle will still be warm.”</p></section>
    </div><aside class="dashboard-aside">
      <section class="companion-panel"><div class="panel-label">${icon('paw')} GOOD COMPANY</div><div class="pet-habitat companion-meadow">${garden()}${sprite(current.id, 'floating-pet')}<div class="pet-ground"></div></div><h2>${current.name} <span class="pet-type">${current.species}</span></h2><p class="pet-quote">“${current.quote}”</p><button class="text-button" data-action="navigate" data-route="companions">Say hello to the others ${icon('arrow')}</button></section>
      <section class="daily-panel"><span class="paper-tape" aria-hidden="true"></span><div class="panel-label">${icon('flame')} SOMETHING SMALL FOR TODAY</div><h2>${dailyDone ? 'Nicely done, you.' : 'Fancy a quick question?'}</h2><p>${dailyDone ? 'Today’s question is done. Come back whenever you’re ready for another.' : 'A tiny challenge to keep you curious. And a few coins for your pocket.'}</p><div class="rewards">${rewardLine(50, 25)}</div><button class="button ${dailyDone ? 'subtle' : 'outline'}" data-action="daily" ${dailyDone ? 'disabled' : ''}>${dailyDone ? icon('check') + ' All done for today' : 'Give it a try ' + icon('arrow')}</button><span class="daily-note">A fresh question each day</span></section>
    </aside></div><div class="reassurance">${icon('leaf')} No timers. No lost hearts. You’re welcome to take your time.</div>`;
}

function chapterCard(ch) {
  const group = quests.filter(q => q.chapter === ch.id), done = group.filter(q => state.completed.includes(q.id)).length;
  const unlocked = isUnlocked(state, group[0].id);
  return `<button class="chapter-stop ${ch.color} ${unlocked ? '' : 'locked'} ${done === 4 ? 'finished' : ''}" data-action="chapter" data-id="${ch.id}" aria-label="Chapter ${ch.numeral}: ${ch.title}${unlocked ? '' : ', locked'}"><span class="chapter-emblem">${icon(done === 4 ? 'check' : ch.icon)}</span><span class="chapter-stop-copy"><span class="eyebrow">CHAPTER ${ch.numeral} · ${ch.topic}</span><strong>${ch.title}</strong><span>${ch.description}</span></span><span class="chapter-stop-progress"><span>${done} / 4</span>${unlocked ? icon('arrow') : icon('lock')}</span></button>`;
}

function renderQuests() {
  return renderWorld(state, pet(), mapSelection, journeyReceipt);
}

function visitVillage(id) {
  villageSession?.pause();
  if (id === 'cafe') { openCafe(); return; }
  if (villagers.some(v => v.id === id)) { openVillager(id); return; }
  const destination = { workbench: 'practice', companions: 'companions', trail: 'quests', room: 'room', festival: 'festival' }[id];
  if (destination) navigate(destination);
}
function openCafe() {
  cancelRun(); activeDemo = null; villageSession?.pause();
  if (questDialog.open) closeQuest();
  villageDialog.innerHTML = renderCafe(state, pet());
  if (!villageDialog.open) villageDialog.showModal();
  $('.dialog-top button', villageDialog)?.focus();
}
function refreshRoom(slot) {
  roomSlot = slot;
  save(); render();
  $(`[data-action="room-remove"][data-id="${slot}"]`)?.focus({ preventScroll: true });

}
function openVillager(id) {
  if (!villagers.some(v => v.id === id)) return;
  cancelRun(); activeDemo = null;
  if (questDialog.open) closeQuest();
  villageSession?.pause();
  meetVillager(state, id); save();
  villageDialog.innerHTML = renderVillager(state, id);
  if (!villageDialog.open) villageDialog.showModal();
  $('.dialog-top button', villageDialog)?.focus();
}
function closeVillage() { cancelRun(); activeDemo = null; villageDialog.close(); ($('.village-viewport') || $('#main'))?.focus({ preventScroll: true }); }
villageDialog.addEventListener('cancel', () => { cancelRun(); activeDemo = null; });
villageDialog.addEventListener('close', () => { if (!villageDialog.open) activeDemo = null; });
function openProject(id) {
  const project = projects.find(p => p.id === id);
  if (!project || !projectUnlocked(state, id)) { toast('Follow the quest trail to learn the skills for this project.', 'lock'); return; }
  cancelRun(); villageSession?.pause(); activeDemo = null; villageDialog.close();
  activeQuest = project; selectedAnswer = null; solved = false; renderQuest();
  if (!questDialog.open) questDialog.showModal();
}
function openProjectDemo(id) {
  const project = projects.find(p => p.id === id);
  if (!project?.demo || !state.projects.includes(id) || !state.projectCode[id]) return;
  if (questDialog.open) closeQuest();
  cancelRun(); villageSession?.pause(); activeDemo = project;
  activeGame = project.id === 'project-guessing-game' ? { secret: 1 + Math.floor(Math.random() * 100), attempts: [], won: false } : null;
  villageDialog.innerHTML = renderProjectDemo(project) + (route === 'festival' ? '<div class="festival-demo-return"><button class="text-button" data-action="festival-return">Return to the festival</button></div>' : '');
  if (!villageDialog.open) villageDialog.showModal();
  $('#project-demo-form').addEventListener('submit', executeProjectDemo);
}
async function executeProjectDemo(event) {
  event.preventDefault();
  const project = activeDemo, game = activeGame, form = event.target;
  if (!project || $('#project-demo-run')?.disabled) return;
  let code;
  const values = Object.fromEntries(new FormData(form));
  if (game) values.secret = game.secret;
  try { code = demoSource(project, state.projectCode[project.id], values); }
  catch (error) { $('#project-demo-output').textContent = error.message; return; }
  const run = $('#project-demo-run'), stop = $('#project-demo-stop'), status = $('#project-demo-status'), output = $('#project-demo-output');
  run.disabled = true; stop.hidden = false; output.classList.remove('output-error');
  const result = await runPython(code, '', phase => { if (activeDemo === project && form.isConnected) status.textContent = phase === 'loading' ? 'Warming up Python…' : 'Trying your creation…'; });
  if (activeDemo !== project || !form.isConnected) return;
  run.disabled = false; stop.hidden = true;
  output.textContent = result.passed ? result.output || 'Your code ran successfully.' : result.error;
  output.classList.toggle('output-error', !result.passed && !result.cancelled);
  status.textContent = result.passed ? 'Made by you. Change the values and try again.' : result.cancelled ? 'Stopped. Your creation is still saved.' : 'Revisit the project code to make an adjustment.';
  if (game && result.passed) {
    const clue = result.output.trim().split('\n').at(-1);
    game.attempts.push(`Guess ${game.attempts.length + 1}: ${values.guess} — ${clue}`);
    game.won = Number(values.guess) === game.secret;
    output.textContent = game.attempts.join('\n');
    status.textContent = game.won ? `You found it in ${game.attempts.length} ${game.attempts.length === 1 ? 'guess' : 'guesses'}! Mira rings the festival bell.` : 'Your Python gave you a clue. Try another guess.';
    run.disabled = game.won;
    if (game.won) chime(); else form.elements.guess.select();
  }
}
function downloadProject(id) {
  const project = projects.find(p => p.id === id), code = state.projectCode[id];
  if (!project || !code || !state.projects.includes(id)) return;
  const url = URL.createObjectURL(new Blob([`# ${project.title}\n# Made in Hearthcode\n\n${code}\n`], { type: 'text/x-python;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${id.replace('project-', '')}.py`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast('Your Python project is ready to keep.', 'download');
}

function editorMarkup(code, id) { return `<div class="editor"><div class="editor-toolbar"><span><span class="code-dot"></span> ${id === 'practice-code' ? 'playground.py' : 'your_spell.py'}</span><span>PYTHON 3</span></div><div class="editor-body"><div class="line-numbers" aria-hidden="true">${code.split('\n').map((_, i) => i + 1).join('\n')}</div><textarea id="${id}" class="code-input" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" maxlength="30000" aria-label="Python code editor">${esc(code)}</textarea></div><div class="editor-footer">Ctrl / ⌘ + Enter to run <span>Tab indents · Esc then Tab to leave</span></div></div>`; }
const practiceSamples = {
  hello: '# Your own little corner of the tavern.\n# Try changing the name and run your code!\n\nname = "Adventurer"\nprint("Welcome to Hearthcode, " + name + "!")\n',
  loop: 'companions = ["Pip", "Fern", "Ember"]\n\nfor friend in companions:\n    print("Hello, " + friend + "!")',
  model: '# Train y = weight * x on a tiny dataset.\nxs = [1, 2, 3]\nys = [2, 4, 6]\nweight = 0.0\n\nfor step in range(100):\n    gradient = sum(2*x*(weight*x-y) for x,y in zip(xs,ys))/len(xs)\n    weight -= 0.05 * gradient\n\nprint("Learned weight:", round(weight, 3))\nprint("Prediction for x=4:", round(weight * 4, 3))'
};
function renderPractice() {
  return `<div class="page-heading"><div><p class="eyebrow">A QUIET CORNER TO TRY THINGS OUT</p><h1>The practice room<span class="gold">.</span></h1><p>Make a guess. Run a little code. See what happens.</p></div></div><div class="practice-layout"><section class="practice-workbench"><div class="section-heading"><h2>Your Python workbench</h2><label class="sample-label">Try an example <select id="sample-select"><option value="">Choose a spell…</option><option value="hello">A friendly hello</option><option value="loop">Companion greetings</option><option value="model">Train a tiny model</option></select></label></div>${editorMarkup(state.drafts.practice ?? practiceSamples.hello, 'practice-code')}<div class="run-row"><span class="muted" id="practice-status">A place to experiment. No XP or coins awarded.</span><button class="button primary" data-action="run-practice" id="practice-run">${icon('play')} Run Python</button><button class="button subtle" data-action="stop" id="practice-stop" hidden>${icon('stop')} Stop</button></div><div class="output-panel"><div class="output-heading">${icon('code')} OUTPUT</div><pre id="practice-output" aria-live="polite">Your spell’s output will appear here.</pre></div><p class="runtime-note">Real Python runs privately in your browser. The first run downloads the Python engine and needs an internet connection. Standard-library exercises are supported; interactive input() and installing packages are not part of this room.</p></section><aside><section class="panel"><div class="panel-label">${icon('book')} A LITTLE CHEAT SHEET</div><dl class="cheat-sheet"><dt>Say something</dt><dd><code>print("Hello!")</code></dd><dt>Remember a value</dt><dd><code>coins = 10</code></dd><dt>Make a choice</dt><dd><code>if coins &gt; 5:<br>    print("Plenty!")</code></dd><dt>Repeat a task</dt><dd><code>for i in range(3):<br>    print(i)</code></dd><dt>Create a function</dt><dd><code>def double(x):<br>    return x * 2</code></dd></dl></section><div class="practice-pet">${sprite(pet().id)}<p>“${pet().quote}”</p></div></aside></div>`;
}

function renderCompanions() {
  return `<div class="page-heading"><div><p class="eyebrow">EVERY ADVENTURER NEEDS A LITTLE COMPANY</p><h1>Friends by the fire<span class="gold">.</span></h1><p>Earn coins, make progress, and give a curious creature a place to call home.</p></div><div class="balance-badge">${icon('coin')} <strong>${state.coins}</strong> coins to spend</div></div><div class="companion-banner">${icon('paw')}<span><strong>${state.owned.length} of ${pets.length} companions welcomed.</strong> Your active friend joins you around the tavern. Companions are cosmetic; every learner gets the same free hints.</span></div><div class="pet-shop-grid">${pets.map(p => {
    const owned = state.owned.includes(p.id), equipped = state.equipped === p.id, questLocked = state.completed.length < p.required, affordable = state.coins >= p.cost;
    return `<article class="pet-shop-card ${p.color} ${equipped ? 'equipped' : ''}"><div class="pet-shop-top"><span class="eyebrow">${p.rarity}</span>${equipped ? '<span class="active-badge">BY YOUR SIDE</span>' : owned ? icon('check') : icon('lock')}</div><div class="pet-habitat ${p.color}"><span class="pixel-star star-one">✦</span>${sprite(p.id, 'floating-pet')}<div class="pet-ground"></div></div><h2>${p.name}</h2><span class="pet-species">${p.species}</span><p>${p.description}</p><div class="pet-requirement">${icon(questLocked ? 'lock' : 'check')} ${p.required === 0 ? 'Your first friend, on the house' : `${p.required} quests completed · ${Math.min(state.completed.length, p.required)}/${p.required}`}</div><button class="button ${equipped ? 'subtle' : owned ? 'outline' : 'primary'} full" data-action="adopt" data-id="${p.id}" ${equipped || (!owned && (questLocked || !affordable)) ? 'disabled' : ''}>${equipped ? icon('check') + ' Adventuring together' : owned ? 'Bring along ' + icon('arrow') : questLocked ? icon('lock') + ` Unlock after ${p.required} quests` : affordable ? icon('coin') + ` Adopt for ${p.cost} coins` : icon('coin') + ` ${p.cost - state.coins} more coins needed`}</button>${!owned && questLocked ? `<span class="pet-price">Adoption: ${p.cost} coins</span>` : ''}</article>`;
  }).join('')}</div>`;
}

function renderAchievements() {
  return `<div class="page-heading"><div><p class="eyebrow">LITTLE MILESTONES. WELL-EARNED MAGIC.</p><h1>Your wall of wonders<span class="gold">.</span></h1><p>Every achievement tells a story about how far you’ve come.</p></div><span class="completion-pill">${icon('trophy')} ${state.achievements.length} / ${achievements.length} unlocked</span></div><div class="achievement-grid">${achievements.map(a => {
    const earned = state.achievements.includes(a.id), [value, target] = a.progress(state), percent = Math.min(100, Math.floor(value / target * 100));
    return `<article class="achievement-card ${earned ? 'earned' : ''}"><span class="achievement-medal">${icon(a.icon)}</span><span class="achievement-status">${earned ? icon('check') + ' UNLOCKED' : icon('lock') + ' NOT YET UNLOCKED'}</span><h2>${a.name}</h2><p>${a.description}</p><div class="achievement-progress"><span>${Math.min(value, target)} / ${target}</span><span>${icon('coin')} ${a.coins} coins ${earned ? 'earned' : 'reward'}</span></div>${progressBar(percent)}</article>`;
  }).join('')}</div>`;
}

function openQuest(id) {
  worldSession?.finishTravel();
  const q = quests.find(item => item.id === id);
  if (!q || !isUnlocked(state, id)) { toast('Finish the previous quest to unlock this one.', 'lock'); return; }
  activeQuest = q; selectedAnswer = null; solved = false; renderQuest();
  if (!questDialog.open) questDialog.showModal();
}
function openDaily() {
  if (state.daily.includes(dateKey())) { toast('Today’s spark is already complete. Come back tomorrow!', 'check'); return; }
  const date = dateKey(), index = Math.floor(Date.parse(date + 'T12:00:00Z') / 86400000) % dailyQuestions.length;
  const question = dailyQuestions[index];
  activeQuest = { ...question, id: 'daily', date, type: 'quiz', title: 'The daily spark', subtitle: 'One question to keep your curiosity lit', xp: 50, coins: 25, lesson: ['A small practice is a powerful thing. Try today’s question; a wrong answer simply gives you another chance.', 'Daily sparks revisit Python, AI, and machine learning concepts. If today’s idea is new, the hint will help you reason it through.'], hint: question.explanation, takeaway: question.explanation, explanations: question.options.map((_, i) => i === question.answer ? question.explanation : 'Not quite. Open the hint for a short explanation, then try again.') };
  selectedAnswer = null; solved = false; renderQuest(); if (!questDialog.open) questDialog.showModal();
}
function renderQuest() {
  const q = activeQuest, ch = chapters[q.chapter];
  questDialog.innerHTML = `<div class="dialog-top"><span class="eyebrow">${q.kind === 'project' ? 'VILLAGE PROJECT / ' + villagers.find(v => v.id === q.npc).name.toUpperCase() : q.id === 'daily' ? 'A LITTLE PRACTICE, EVERY DAY' : `CHAPTER ${ch.numeral} · QUEST ${String(quests.indexOf(q) + 1).padStart(2, '0')} / ${quests.length}`}</span><button class="icon-button" data-action="close-quest" aria-label="Close quest">${icon('close')}</button></div><div class="quest-modal-heading"><h2>${q.title}</h2><p>${q.subtitle}</p><div class="rewards">${rewardLine(q.xp, q.coins)}${(q.kind === 'project' ? state.projects : state.completed).includes(q.id) ? '<span class="replay-label">Replay · rewards already earned</span>' : ''}</div></div><div class="quest-columns"><section class="lesson-pane"><div class="lesson-label">${icon('book')} THE LESSON</div>${ch ? `<p class="lesson-stage">${esc(ch.difficulty)} · ${esc(ch.label)}</p>` : ''}${q.buildsOn ? `<p class="lesson-prerequisites">Builds on: ${q.buildsOn.map(esc).join(' · ')}</p>` : ''}${q.lesson.map(p => `<p>${esc(p)}</p>`).join('')}${q.example ? `<pre class="example-code"><code>${esc(q.example)}</code></pre>` : ''}<div class="lesson-companion">${sprite(pet().id)}<div><strong>${pet().name} is cheering you on.</strong><span>No rush. You can try as many times as you need.</span></div></div><details class="hint"><summary>${icon('spark')} Need a little hint?</summary><p>${esc(q.hint)}</p></details>${q.solution ? `<details class="hint solution"><summary>${icon('help')} Walk me through the solution</summary><p>Read the code, then type it into the editor. Try changing a value to see what happens.</p><pre><code>${esc(q.solution)}</code></pre></details>` : ''}</section><section class="challenge-pane"><div class="lesson-label">${icon(q.type === 'code' ? 'code' : 'spark')} ${q.type === 'code' ? 'YOUR CODING CHALLENGE' : 'PUT IT INTO PRACTICE'}</div><h3>${esc(q.task)}</h3>${q.snippet ? `<pre class="example-code"><code>${esc(q.snippet)}</code></pre>` : ''}${q.type === 'code' ? `${editorMarkup(state.drafts[q.id] ?? state.projectCode[q.id] ?? q.starter, 'quest-code')}<div class="run-row"><button class="button primary" id="quest-run" data-action="run-quest">${icon('play')} Run & check</button><button class="button subtle" id="quest-stop" data-action="stop" hidden>${icon('stop')} Stop</button><button class="text-button" data-action="reset-code" title="Restore the starter code">${icon('reset')} Reset code</button></div><p class="runtime-note" id="quest-status">First run loads real Python. An internet connection is needed.</p>` : `<div class="answer-options" role="radiogroup" aria-label="Choose an answer">${q.options.map((option, i) => `<button class="answer-option" data-action="answer" data-index="${i}" role="radio" aria-checked="false"><span class="answer-letter">${String.fromCharCode(65 + i)}</span><span>${esc(option)}</span><span class="answer-indicator"></span></button>`).join('')}</div><button class="button primary" id="check-answer" data-action="check-answer" disabled>Check answer ${icon('arrow')}</button>`}<div id="quest-feedback" class="quest-feedback" aria-live="polite"></div></section></div>`;
  if (q.type === 'code') bindEditor($('#quest-code'), q.id);
}
function completeActive(output = '', submittedCode = '') {
  if (solved || !activeQuest) return;
  const q = activeQuest;
  if (q.id === 'daily' && q.date !== dateKey()) { toast('A new day has begun. Open the daily spark again for today’s question.', 'clock'); closeQuest(); return; }
  const previousLevel = levelInfo(state.xp).level;
  const result = q.kind === 'project' ? completeProject(state, q.id, submittedCode) : q.id === 'daily' ? completeDaily(state, q.date) : completeQuest(state, q.id);
  if (!result.ok) { toast(result.reason, 'help'); return; }
  solved = true; save(); chime();
  const leveled = levelInfo(state.xp).level > previousLevel;
  if (q.kind === 'project') { renderProjectSuccess(q, result, output, leveled); return; }
  const travel = travelForCompletion(q.id, result);
  if (travel) {
    pendingTravel = travel;
    mapSelection = Math.min(travel.to, quests.length - 1);
    journeyReceipt = { quest: q, result, leveled, level: levelInfo(state.xp).level, output };
    questDialog.close(); activeQuest = null;
    if (route !== 'quests') history.pushState(null, '', '#quests');
    route = 'quests'; render();
    celebrate({ xp: result.xp, coins: result.coins, level: leveled ? levelInfo(state.xp).level : null, achievements: result.achievements });
    $('.world-viewport').focus({ preventScroll: true });
    $('.world-shell').scrollIntoView({ behavior: state.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    return;
  }
  render(); notifyAchievements(result.achievements);
  const next = q.id !== 'daily' ? quests[quests.indexOf(q) + 1] : null;
  questDialog.innerHTML = `<div class="dialog-top"><span class="eyebrow">${result.replay ? 'PRACTICE MAKES PROGRESS' : 'ANOTHER LITTLE SPARK'}</span><button class="icon-button" data-action="close-quest" aria-label="Close quest">${icon('close')}</button></div><div class="success-screen"><div class="success-illustration">${rewardChest()}</div><p class="eyebrow">${q.id === 'daily' ? 'DAILY SPARK COMPLETE' : 'QUEST COMPLETE'}</p><h2>${q.id === 'masters-pipeline' ? 'Master of the Hearthlands.' : q.id === 'guild-trial' ? 'You’re a legend of the tavern.' : result.replay ? 'Still got the magic.' : 'Look at you, learning new spells.'}</h2><p>${esc(q.takeaway)}</p>${output.trim() ? `<pre class="success-output">${esc(output.slice(0, 2000))}</pre>` : ''}<div class="success-rewards">${result.replay ? '<span>Practice complete · First-clear rewards already collected.</span>' : rewardLine(result.xp, result.coins)}</div>${leveled ? `<div class="level-up">${icon('spark')} Level up! You’re now level ${levelInfo(state.xp).level}.</div>` : ''}<div class="success-pet">${sprite(pet().id)}<span>${pet().name} looks very proud of you.</span></div><div class="success-actions"><button class="button outline" data-action="close-quest">Back to the tavern</button>${next ? `<button class="button primary" data-action="quest" data-id="${next.id}">Next quest ${icon('arrow')}</button>` : `<button class="button primary" data-action="browse-pets">Visit your companions ${icon('paw')}</button>`}</div></div>`;
  $('.success-actions button', questDialog)?.focus();
  if (!result.replay) celebrate({ xp: result.xp, coins: result.coins, level: leveled ? levelInfo(state.xp).level : null, daily: q.id === 'daily', achievements: result.achievements }, questDialog);
}
function renderProjectSuccess(project, result, output, leveled) {
  render(); notifyAchievements(result.achievements);
  const villager = villagers.find(v => v.id === project.npc);
  questDialog.innerHTML = `<div class="dialog-top"><span class="eyebrow">${result.replay ? 'A FRESH POLISH' : 'MADE WITH A FRIEND'}</span><button class="icon-button" data-action="close-quest" aria-label="Close project">${icon('close')}</button></div><div class="success-screen"><div class="success-illustration">${rewardChest()}</div><p class="eyebrow">VILLAGE PROJECT COMPLETE</p><h2>${esc(project.title)}</h2><p>${esc(project.storyAfter)}</p><p>${esc(project.takeaway)}</p>${output.trim() ? `<pre class="success-output">${esc(output.slice(0, 2000))}</pre>` : ''}<div class="success-rewards">${result.replay ? '<span>Updated creation saved · Rewards already earned.</span>' : rewardLine(result.xp, result.coins)}</div><p class="friendship-success">♥ ${esc(villager.name)} · ${result.friendship.count}/2 projects together · ${esc(result.friendship.label)}</p>${leveled ? `<div class="level-up">${icon('spark')} You reached level ${levelInfo(state.xp).level}.</div>` : ''}<div class="success-actions"><button class="button outline" data-action="festival-return">See the festival ${icon('spark')}</button><button class="button outline" data-action="villager" data-id="${project.npc}">Talk to ${esc(villager.name)}</button>${project.demo ? `<button class="button primary" data-action="project-demo" data-id="${project.id}">Try your creation ${icon('play')}</button>` : ''}<button class="text-button" data-action="project-download" data-id="${project.id}">${icon('download')} Keep the Python file</button></div></div>`;
  $('.success-actions button', questDialog)?.focus();
  if (!result.replay) celebrate({ xp: result.xp, coins: result.coins, level: leveled ? levelInfo(state.xp).level : null, achievements: result.achievements }, questDialog);
}
function closeQuest() { cancelRun(); celebration?.dispose(); questDialog.close(); activeQuest = null; }
questDialog.addEventListener('cancel', () => { cancelRun(); activeQuest = null; });
questDialog.addEventListener('close', () => { if (questDialog.open) return; activeQuest = null; if (celebration?.parent === questDialog) celebration.dispose(); });

function bindEditor(textarea, key) {
  if (!textarea) return;
  let allowTab = false;
  textarea.addEventListener('input', () => { saveDraft(key, textarea.value); textarea.previousElementSibling.textContent = textarea.value.split('\n').map((_, i) => i + 1).join('\n'); });
  textarea.addEventListener('scroll', () => { textarea.previousElementSibling.scrollTop = textarea.scrollTop; });
  textarea.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); if (key === 'practice') executePractice(); else executeQuest(); }
    if (event.key === 'Escape') { allowTab = true; event.stopPropagation(); }
    if (event.key === 'Tab' && !allowTab && !event.shiftKey) { event.preventDefault(); const start = textarea.selectionStart; textarea.setRangeText('    ', start, textarea.selectionEnd, 'end'); textarea.dispatchEvent(new Event('input')); }
    else if (event.key === 'Tab') allowTab = false;
  });
}
async function executeQuest() {
  if (!activeQuest || solved || activeQuest.type !== 'code' || $('#quest-run')?.disabled) return;
  const q = activeQuest, code = $('#quest-code').value;
  saveDraft(q.id, code); $('#quest-feedback').innerHTML = ''; setRunning('quest', true);
  const result = await runPython(code, q.checks, phase => { const status = $('#quest-status'); if (status) status.textContent = phase === 'loading' ? 'Warming up Python… the first run can take a moment.' : 'Running your spell and checking its results…'; });
  if (activeQuest !== q || !questDialog.open) return;
  setRunning('quest', false); $('#quest-status').textContent = result.cancelled ? 'Execution stopped.' : 'Your draft is saved. Keep experimenting.';
  if (result.passed) completeActive(result.output, code);
  else $('#quest-feedback').innerHTML = `<div class="feedback ${result.cancelled ? '' : 'error'}"><strong>${result.runtimeError ? 'The workbench needs a connection' : result.cancelled ? 'Spell stopped' : 'A clue for your next try'}</strong><p>${esc(result.error)}</p>${result.output ? `<pre>${esc(result.output)}</pre>` : ''}</div>`;
}
async function executePractice() {
  if (!$('#practice-code') || $('#practice-run').disabled) return;
  const code = $('#practice-code').value; saveDraft('practice', code); setRunning('practice', true);
  $('.output-panel').classList.remove('practice-done');
  $('.output-heading').innerHTML = `${icon('code')} OUTPUT`;
  const result = await runPython(code, '', phase => { if ($('#practice-status')) $('#practice-status').textContent = phase === 'loading' ? 'Warming up Python…' : 'Running your code…'; });
  if (route !== 'practice' || !$('#practice-output')) return;
  setRunning('practice', false); $('#practice-output').textContent = (result.output || '') + (result.passed ? result.output ? '' : 'Code finished successfully. Use print() to display a result.' : '\n' + result.error); $('#practice-output').classList.toggle('output-error', !result.passed && !result.cancelled); $('#practice-status').textContent = result.passed ? 'Spell complete. What will you try next?' : 'Edit your code and try again.';
  $('.output-panel').classList.toggle('practice-done', result.passed);
  $('.output-heading').innerHTML = `${icon(result.passed ? 'check' : 'code')} ${result.passed ? 'NICELY DONE · YOUR CODE RAN' : 'OUTPUT'}`;
}
function setRunning(prefix, value) { const run = $(`#${prefix}-run`), stop = $(`#${prefix}-stop`); if (run) { run.disabled = value; run.innerHTML = value ? '<span class="spinner"></span> Running…' : `${icon('play')} ${prefix === 'quest' ? 'Run & check' : 'Run Python'}`; } if (stop) stop.hidden = !value; }

function openSettings() {
  cancelRun();
  villageSession?.pause();
  settingsDialog.innerHTML = `<div class="dialog-top"><span class="eyebrow">MAKE YOURSELF AT HOME</span><button class="icon-button" data-action="close-settings" aria-label="Close settings">${icon('close')}</button></div><div class="settings-body"><h2>Your adventure, your way.</h2><form id="settings-form"><label class="field-label" for="adventurer-name">Adventurer name</label><input id="adventurer-name" name="name" maxlength="24" value="${esc(state.name)}" required><label class="toggle-row"><span><strong>Reward sounds</strong><small>A gentle chime when you complete a quest.</small></span><input type="checkbox" name="sound" ${state.sound ? 'checked' : ''}></label><label class="toggle-row"><span><strong>Reduce motion</strong><small>Keep companions, lamplight, and effects still.</small></span><input type="checkbox" name="motion" ${state.reducedMotion ? 'checked' : ''}></label><button class="button primary full" type="submit">Save preferences ${icon('check')}</button></form><div class="settings-divider"></div><h3>Keep your story safe</h3><p>Progress is saved on this browser and device. Export a backup to carry your adventure to another browser. Import replaces the progress currently saved here.</p><div class="backup-actions"><button class="button outline" data-action="export">${icon('download')} Export save</button><label class="button outline file-label">Import save<input type="file" id="import-save" accept="application/json,.json" aria-label="Import a Hearthcode save"></label></div><div class="settings-divider"></div><details class="reset-details"><summary>Start a new adventure</summary><p>This clears your quests, coins, XP, companions, room furnishings, and festival progress in this browser. Export a backup first if you want to keep them.</p><button class="button danger" data-action="reset-progress">Reset my progress</button></details><p class="settings-footnote">Made for learning at your pace. No accounts, ads, or paid upgrades.</p></div>`;
  settingsDialog.showModal();
  $('#settings-form').addEventListener('submit', event => { event.preventDefault(); state.name = $('#adventurer-name').value.trim() || 'Adventurer'; state.sound = event.target.sound.checked; state.reducedMotion = event.target.motion.checked; save(); settingsDialog.close(); render(); toast('Your corner of the tavern feels a little more like you.', 'check'); });
  $('#import-save').addEventListener('change', importSave);
}
function exportSave() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `hearthcode-adventure-${dateKey()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); toast('Adventure exported. Keep your save somewhere safe.', 'download');
}
async function importSave(event) {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 1000000) throw new Error('That file is too large to be a Hearthcode save.');
    const imported = normalizeState(JSON.parse(await file.text()));
    const backup = JSON.stringify(state);
    try { localStorage.setItem('hearthcode-before-import', backup); } catch { /* Export remains available when storage is restricted. */ }
    villageSession?.dispose(); villageSession = null;
    state = imported; mapSelection = null; journeyReceipt = null; pendingTravel = null; save(); settingsDialog.close(); render(); toast('Welcome back. Your adventure has been restored.', 'check');
  } catch (error) { toast('Could not import save: ' + error.message, 'help', 7000); event.target.value = ''; }
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const { action, id } = button.dataset;
  switch (action) {
    case 'room-slot': roomSlot = id; render(); $(`[data-action="room-slot"][data-id="${id}"]`)?.focus({ preventScroll: true }); break;
    case 'room-furnish': { const result = furnishRoom(state, id); if (!result.ok) { toast(result.reason, 'coin'); break; } refreshRoom(result.item.slot); if (result.purchased) chime(); toast(`${result.item.name} is in your room.`, 'home'); break; }
    case 'room-remove': { const result = removeFurnishing(state, id); if (result.ok) { refreshRoom(id); toast('A little space to try something new. Your furnishing is still yours.', 'home'); } break; }
    case 'festival-return': if (questDialog.open) closeQuest(); if (villageDialog.open) closeVillage(); navigate('festival'); break;
    case 'festival-celebrate': { const result = celebrateFestival(state); if (!result.ok) { toast(result.reason, 'help'); break; } save(); render(); if (!result.replay) { chime(); celebrate({ xp: result.xp, coins: result.coins, achievements: [] }); toast('The lantern festival is open. A keepsake is waiting on your room shelf.', 'spark', 6500); } break; }
    case 'villager': openVillager(id); break;
    case 'project': openProject(id); break;
    case 'project-demo': openProjectDemo(id); break;
    case 'project-download': downloadProject(id); break;
    case 'close-village': closeVillage(); break;
    case 'village-route': closeVillage(); navigate(button.dataset.route); break;
    case 'navigate': navigate(button.dataset.route); break;
    case 'quest': cancelRun(); openQuest(id); break;
    case 'daily': openDaily(); break;
    case 'close-quest': closeQuest(); break;
    case 'browse-pets': closeQuest(); navigate('companions'); break;
    case 'chapter': mapSelection = Number(id) * 4; navigate('quests'); break;
    case 'dismiss-receipt': journeyReceipt = null; button.closest('.journey-receipt')?.remove(); break;
    case 'adopt': { const result = adoptPet(state, id); if (!result.ok) { toast(result.reason, 'coin'); break; } save(); render(); chime(); if (result.equipped) toast(`${pet().name} is ready for an adventure.`, 'paw'); else celebrate({ adoption: true, achievements: result.achievements }); notifyAchievements(result.achievements); break; }
    case 'answer': selectedAnswer = Number(button.dataset.index); for (const option of questDialog.querySelectorAll('.answer-option')) { const selected = Number(option.dataset.index) === selectedAnswer; option.classList.toggle('selected', selected); option.setAttribute('aria-checked', String(selected)); } $('#check-answer').disabled = false; $('#quest-feedback').innerHTML = ''; break;
    case 'check-answer': if (!activeQuest || selectedAnswer === null || solved) break; if (selectedAnswer === activeQuest.answer) completeActive(); else $('#quest-feedback').innerHTML = `<div class="feedback error"><strong>Not quite—but you’re learning.</strong><p>${esc(activeQuest.explanations[selectedAnswer])}</p><span>Try another answer. No hearts lost here.</span></div>`; break;
    case 'run-quest': executeQuest(); break;
    case 'run-practice': executePractice(); break;
    case 'stop': cancelRun(); break;
    case 'reset-code': if (activeQuest && !$('#quest-run')?.disabled) { state.drafts[activeQuest.id] = activeQuest.starter; save(); renderQuest(); } break;
    case 'sound': state.sound = !state.sound; save(); button.innerHTML = icon(state.sound ? 'sound' : 'mute'); button.setAttribute('aria-pressed', String(state.sound)); button.setAttribute('aria-label', state.sound ? 'Turn reward sounds off' : 'Turn reward sounds on'); button.title = `Reward sounds ${state.sound ? 'on' : 'off'}`; if (state.sound) chime(); toast(`Reward sounds ${state.sound ? 'on' : 'off'}.`, state.sound ? 'sound' : 'mute'); break;
    case 'settings': openSettings(); break;
    case 'close-settings': settingsDialog.close(); break;
    case 'export': exportSave(); break;
    case 'reset-progress': villageSession?.dispose(); villageSession = null; state = freshState(); mapSelection = null; journeyReceipt = null; pendingTravel = null; clearTimeout(saveTimer); save(); settingsDialog.close(); navigate('village'); toast('A fresh page. A new adventure. Pip is waiting for you.', 'flame'); break;
  }
});
document.addEventListener('change', event => {
  if (event.target.id === 'village-time') { state.villageTime = periods.includes(event.target.value) ? event.target.value : 'auto'; save(); render(); $('#village-time')?.focus({ preventScroll: true }); }
  if (event.target.id === 'sample-select' && practiceSamples[event.target.value]) { cancelRun(); state.drafts.practice = practiceSamples[event.target.value]; save(); render(); }
});
document.addEventListener('keydown', event => {
  if (!event.target.matches('.answer-option') || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault(); const options = [...questDialog.querySelectorAll('.answer-option')]; const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1; const next = options[(options.indexOf(event.target) + direction + options.length) % options.length]; next.focus(); next.click();
});
render();
