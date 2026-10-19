import { projects, villagers, friendship, projectUnlocked } from './projects.js';
import { icon } from './art.js';

const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function portrait(id) {
  const colors = id === 'mira' ? ['#704332', '#bc623e', '#f2c89e', '#638ca3'] : id === 'elio' ? ['#4d392b', '#385c46', '#ad7556', '#e9be61'] : ['#a0794f', '#53745a', '#edc89a', '#eee4c8'];
  return `<svg class="villager-portrait" viewBox="0 0 64 64" role="img" aria-label="${esc(villagers.find(v => v.id === id)?.name || id)}" shape-rendering="crispEdges"><circle cx="32" cy="32" r="31" fill="${colors[3]}"/><path fill="${colors[1]}" d="M12 48h8v-8h24v8h8v16H12z"/><path fill="${colors[0]}" d="M18 18h5v-5h21v5h5v25H18z"/><path fill="${colors[2]}" d="M23 23h21v19h-6v6H28v-6h-5z"/><path fill="#38392e" d="M26 28h3v4h-3zm12 0h3v4h-3z"/><path fill="#9c5a47" d="M31 37h7v2h-7z"/>${id === 'rowan' ? '<path fill="#f1e6ce" d="M23 34h5v7h11v-7h5v9h-5v5H28v-5h-5z"/>' : id === 'mira' ? '<path fill="#f6da83" d="M18 18h31v5H18z"/><path fill="#547a8b" d="M23 17h8v7h-8zm13 0h8v7h-8z"/>' : '<path fill="#62885c" d="M12 19h43v5H12zm9-8h24v9H21z"/><path fill="#e9bd5c" d="M39 12h5v5h-5z"/>'}<path fill="${colors[3]}" d="M27 49h12v15H27z"/></svg>`;
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
  return `<div class="dialog-top"><span class="eyebrow">${esc(villager.location)}</span><button class="icon-button" data-action="close-village" aria-label="Close conversation">${icon('close')}</button></div><div class="village-conversation"><header class="villager-introduction">${portrait(id)}<div><p class="eyebrow">${esc(villager.role)}</p><h2>${esc(villager.name)}</h2><div class="friendship-line"><span aria-hidden="true">${'♥'.repeat(bond.count)}${'♡'.repeat(2 - bond.count)}</span><span>${esc(bond.label)} · ${bond.count}/2 projects</span></div></div></header><blockquote>${esc(greeting || villager.intro)}</blockquote><p class="village-story-intro">${esc(villager.intro)}</p><div class="section-heading"><h3>A little help goes a long way</h3></div><div class="villager-projects">${projects.filter(p => p.npc === id).map(p => {
    const done = state.projects.includes(p.id), unlocked = projectUnlocked(state, p.id);
    return `<article class="villager-project ${done ? 'project-finished' : ''}"><span class="project-thread-mark">${icon(done ? 'check' : unlocked ? 'code' : 'lock')}</span><div><p class="eyebrow">${done ? 'MADE TOGETHER' : `${p.minutes} MIN · ${p.requires ? 'BUILD ON YOUR LEARNING' : 'BEGINNER FRIENDLY'}`}</p><h3>${esc(p.title)}</h3><p>${esc(done ? p.storyAfter : p.storyBefore)}</p>${!done ? `<span class="project-reward">${icon('spark')} ${p.xp} XP &nbsp; ${icon('coin')} ${p.coins} coins &nbsp; ♥ Friendship</span>` : ''}${unlocked ? `<div class="project-actions"><button class="button ${done ? 'outline' : 'primary'}" data-action="project" data-id="${p.id}">${done ? 'Revisit code' : 'Let’s make it'} ${icon('arrow')}</button>${done && p.demo && state.projectCode[p.id] ? `<button class="text-button" data-action="project-demo" data-id="${p.id}">Try your creation ${icon('play')}</button>` : ''}${done && state.projectCode[p.id] ? `<button class="text-button" data-action="project-download" data-id="${p.id}">${icon('download')} Keep the Python file</button>` : ''}</div>` : `<p class="project-locked">${icon('lock')} ${esc(projectRequirement(state, p))} <button class="text-button" data-action="village-route" data-route="quests">Follow the quest trail ${icon('arrow')}</button></p>`}</div></article>`;
  }).join('')}</div><div class="conversation-footer"><button class="text-button" data-action="close-village">Back to the village ${icon('leaf')}</button>${id === 'rowan' ? '<button class="text-button" data-action="village-route" data-route="tavern">Step inside the tavern →</button>' : id === 'mira' ? '<button class="text-button" data-action="village-route" data-route="practice">Use the workbench →</button>' : ''}</div></div>`;
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
