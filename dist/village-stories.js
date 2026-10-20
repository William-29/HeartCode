import { projects, villagers, friendship, projectUnlocked } from './projects.js';
import { icon } from './art.js';
import { characterPortrait } from './characters.js';
import { villagePeriod, schedules } from './village-life-model.js';
import { buildings } from './restoration-content.js';
import { buildingStage } from './restoration-model.js';

const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function portrait(id) {
  return characterPortrait(id, 'villager-portrait');
}

export function projectRequirement(state, project) {
  if (state.completed.length < project.requires) return `Finish ${project.requires} main quests first (${state.completed.length}/${project.requires}).`;
  if (project.previous && !state.projects.includes(project.previous)) return `First help with “${projects.find(p => p.id === project.previous)?.title}”.`;
  return '';
}

export function renderVillager(state, id) {
  const villager = villagers.find(v => v.id === id);
  if (!villager) return '';
  const bond = friendship(state, id);
  const greeting = villager.friendLines[Math.min(bond.count, villager.friendLines.length - 1)];
  const routine = schedules[villagePeriod(state.villageTime)][id];
  const place = buildings.find(b => b.neighbour === id);
  const repairStage = state.restoration ? buildingStage(state, place.id) : 0;
  const opened = state.restoration?.opened.includes(place.id);
  const restorationNote = `<aside class="neighbour-restoration-note"><p class="eyebrow">OVER IN FOUNDERS’ COURT</p><h3>${place.name}</h3><p>${opened ? place.memories[3] : repairStage ? place.memories[Math.min(repairStage, 2)] : place.memories[0]}</p><button class="text-button" data-action="village-route" data-route="courtyard">${opened ? 'See the place you helped reopen' : 'Hear the story and lend a hand'} ${icon('arrow')}</button></aside>`;
  return `<div class="dialog-top"><span class="eyebrow">${esc(routine.place)}</span><button class="icon-button" data-action="close-village" aria-label="Close conversation">${icon('close')}</button></div><div class="village-conversation"><header class="villager-introduction">${portrait(id)}<div><p class="eyebrow">${esc(villager.role)}</p><h2>${esc(villager.name)}</h2><div class="friendship-line"><span aria-hidden="true">${'♥'.repeat(bond.count)}${'♡'.repeat(2 - bond.count)}</span><span>${esc(bond.label)} · ${bond.count}/2 projects</span></div></div></header><blockquote>${esc(greeting || villager.intro)}</blockquote><p class="villager-routine">${icon('clock')} ${esc(routine.activity)}</p><p class="village-story-intro">${esc(villager.intro)}</p><div class="section-heading"><h3>A little help goes a long way</h3></div><div class="villager-projects">${projects.filter(p => p.npc === id).map(p => {
    const done = state.projects.includes(p.id), unlocked = projectUnlocked(state, p.id);
    return `<article class="villager-project ${done ? 'project-finished' : ''}"><span class="project-thread-mark">${icon(done ? 'check' : unlocked ? 'code' : 'lock')}</span><div><p class="eyebrow">${done ? 'MADE TOGETHER' : `${p.minutes} MIN · ${p.requires ? 'BUILD ON YOUR LEARNING' : 'BEGINNER FRIENDLY'}`}</p><h3>${esc(p.title)}</h3><p>${esc(done ? p.storyAfter : p.storyBefore)}</p>${!done ? `<span class="project-reward">${icon('spark')} ${p.xp} XP &nbsp; ${icon('coin')} ${p.coins} coins &nbsp; ♥ Friendship</span>` : ''}${unlocked ? `<div class="project-actions"><button class="button ${done ? 'outline' : 'primary'}" data-action="project" data-id="${p.id}">${done ? 'Revisit code' : 'Let’s make it'} ${icon('arrow')}</button>${done && p.demo && state.projectCode[p.id] ? `<button class="text-button" data-action="project-demo" data-id="${p.id}">Try your creation ${icon('play')}</button>` : ''}${done && state.projectCode[p.id] ? `<button class="text-button" data-action="project-download" data-id="${p.id}">${icon('download')} Keep the Python file</button>` : ''}</div>` : `<p class="project-locked">${icon('lock')} ${esc(projectRequirement(state, p))} <button class="text-button" data-action="village-route" data-route="quests">Follow the quest trail ${icon('arrow')}</button></p>`}</div></article>`;
  }).join('')}</div>${restorationNote}${id === 'mira' ? '<p><button class="button outline" data-action="village-route" data-route="clockwork">Visit the clockmaker workshop</button></p>' : ''}<aside class="neighbour-restoration-note">${id === 'elio' ? '<p>The water has a story of its own. Bring your companion, record every cast, and see what the observations can teach you.</p><button class="text-button" data-action="village-route" data-route="lake">Follow the path to Willowmere →</button>' : '<p>Nell and Kit are learning Python at the tavern table. A patient explanation can make all the difference.</p><button class="text-button" data-action="village-route" data-route="apprentices">Pull up a chair with the apprentices →</button>'}</aside><div class="conversation-footer"><button class="text-button" data-action="close-village">Back to the village ${icon('leaf')}</button>${id === 'rowan' ? '<button class="text-button" data-action="village-route" data-route="tavern">Step inside the tavern →</button>' : id === 'mira' ? '<button class="text-button" data-action="village-route" data-route="practice">Use the workbench →</button>' : ''}</div></div>`;
}

export function renderProjectDemo(project) {
  const villager = villagers.find(v => v.id === project.npc);
  if (project.id === 'project-guessing-game') return `<div class="dialog-top"><span class="eyebrow">MIRA’S FESTIVAL STALL</span><button class="icon-button" data-action="close-village" aria-label="Close game">${icon('close')}</button></div><div class="village-conversation project-playground"><header class="villager-introduction">${portrait('mira')}<div><p class="eyebrow">POWERED BY YOUR PYTHON</p><h2>The secret in the acorn</h2></div></header><p>Mira has hidden a number from <strong>1 to 100</strong>. Your own <code>guess_feedback</code> function gives the clues. Can you find the number? There’s no time limit.</p><form id="project-demo-form"><div class="project-demo-fields"><label>Your guess<input name="guess" type="number" value="50" min="1" max="100" step="1" required></label></div><button class="button primary" id="project-demo-run" type="submit">${icon('play')} Guess</button><button class="button subtle" id="project-demo-stop" type="button" data-action="stop" hidden>${icon('stop')} Stop</button></form><p class="runtime-note" id="project-demo-status">A new round. Your first clue is one guess away.</p><pre class="project-demo-output" id="project-demo-output" aria-live="polite">Mira shakes the wooden acorn. “Ready when you are.”</pre><div class="conversation-footer"><button class="text-button" data-action="project-demo" data-id="${project.id}">${icon('reset')} Start a new round</button><button class="text-button" data-action="villager" data-id="mira">Back to Mira ${icon('arrow')}</button><button class="text-button" data-action="project-download" data-id="${project.id}">${icon('download')} Download Python</button></div></div>`;
  return `<div class="dialog-top"><span class="eyebrow">YOUR VILLAGE CREATIONS</span><button class="icon-button" data-action="close-village" aria-label="Close project">${icon('close')}</button></div><div class="village-conversation project-playground"><header class="villager-introduction">${portrait(project.npc)}<div><p class="eyebrow">MADE WITH ${esc(villager.name)}</p><h2>${esc(project.title)}</h2></div></header><p>${esc(project.demo.instructions)}</p><form id="project-demo-form"><div class="project-demo-fields">${project.demo.fields.map(f => `<label>${esc(f.label)}<input name="${f.name}" type="${f.type}" value="${esc(f.value)}" ${f.type === 'number' ? `step="${f.step ?? 'any'}" ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''}` : 'maxlength="160"'} required></label>`).join('')}</div><button class="button primary" id="project-demo-run" type="submit">${icon('play')} Try it with your Python</button><button class="button subtle" id="project-demo-stop" type="button" data-action="stop" hidden>${icon('stop')} Stop</button></form><p class="runtime-note" id="project-demo-status">This runs the code you completed, with the values above.</p><pre class="project-demo-output" id="project-demo-output" aria-live="polite">Your creation is ready to try.</pre><div class="conversation-footer"><button class="text-button" data-action="villager" data-id="${project.npc}">Back to ${esc(villager.name)} ${icon('arrow')}</button><button class="text-button" data-action="project-download" data-id="${project.id}">${icon('download')} Download Python</button></div></div>`;
}

export function demoSource(project, code, entries) {
  if (!project?.demo || typeof code !== 'string' || !code.trim()) throw new Error('Complete this project before trying it here.');
  const values = {};
  for (const field of project.demo.fields) {
    const raw = entries[field.name];
    if (raw === undefined || String(raw).trim() === '') throw new Error(`Enter ${field.label.toLowerCase()}.`);
    if (field.type === 'number') {
      const value = Number(raw);
      if (!Number.isFinite(value) || (field.min !== undefined && value < field.min) || (field.max !== undefined && value > field.max) || (field.step === 1 && !Number.isInteger(value))) throw new Error(`Choose a valid value for ${field.label.toLowerCase()}.`);
      values[field.name] = value;
    } else values[field.name] = String(raw).slice(0, 160);
  }
  // A JSON string literal prevents form values from becoming Python instructions.
  const payload = JSON.stringify(JSON.stringify(values));
  return `${code}\n\n# Try your creation with the village controls.\nimport json as __hearth_json\n__hearth_inputs = __hearth_json.loads(${payload})\n${Object.keys(values).map(key => `${key} = __hearth_inputs[${JSON.stringify(key)}]`).join('\n')}\nprint("\\nYour result:")\nprint(${project.demo.expression})\n`;
}
