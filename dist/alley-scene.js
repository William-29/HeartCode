// The backdrop supplies the painted depth; these small, independent light sources
// keep the lane alive without ever changing the traversable ground or hit targets.
function glowStyle(index) {
  return `--flicker-duration:${(4.4 + (index * .47) % 2.5).toFixed(2)}s;--flicker-delay:-${(index * 1.37 % 6).toFixed(2)}s`;
}

function streetlamp(x, y, index, scale = 1) {
  return `<g class="alley-streetlamp" transform="translate(${x} ${y}) scale(${scale})">
    <path d="M-4 2 58 31 77 31 5-2Z" fill="#292726" opacity=".18"/>
    <ellipse cx="2" cy="1" rx="12" ry="4" fill="#26292a" opacity=".33"/>
    <g class="alley-flicker" style="${glowStyle(index)}"><ellipse cx="11" cy="6" rx="78" ry="34" fill="url(#alley-ground-light)"/><path d="M9-67 64 13Q13 32-41 12L10-67Z" fill="url(#alley-cone-light)"/><ellipse cx="11" cy="-65" rx="29" ry="29" fill="url(#alley-bulb-glow)"/></g>
    <path d="M-4 0v-66q0-14 14-14h3" stroke="#3b3b34" stroke-width="5" fill="none"/>
    <path d="M-3-1v-65q0-12 13-12" stroke="#9d8e60" stroke-width="1" fill="none"/>
    <path d="M-7-3h10v5H-7Zm-3 5H6v3h-16Z" fill="#48443a"/>
    <path d="M11-80v7" stroke="#554d39" stroke-width="3"/>
    <path d="M0-68q11-15 23 0l-2 3H2Z" fill="#4b584d"/>
    <path d="M2-68q9-10 18-1" stroke="#a0a17a" stroke-width="1.5" fill="none"/>
    <ellipse class="alley-flicker" style="${glowStyle(index)}" cx="11" cy="-65" rx="8" ry="3" fill="#ffdf9a"/>
    <path d="M5-64h12l-2 10H7Z" fill="#d2ac66" opacity=".65"/>
    <path class="alley-flicker" style="${glowStyle(index)}" d="M8-63h6v8H8Z" fill="#fff0bf"/>
  </g>`;
}

function existingLampGlow(x, y, groundX, groundY, index) {
  return `<g class="alley-flicker" style="${glowStyle(index)}"><ellipse cx="${groundX}" cy="${groundY}" rx="78" ry="31" fill="url(#alley-ground-light)"/><ellipse cx="${x}" cy="${y}" rx="30" ry="35" fill="url(#alley-bulb-glow)"/></g>`;
}

function stringGlows() {
  return `<g class="alley-string">${[[416, 30], [451, 37], [486, 43], [520, 43], [555, 42], [590, 39], [624, 29]].map(([x, y], index) => `<g class="alley-flicker" style="${glowStyle(index + 7)}"><circle cx="${x}" cy="${y}" r="19" fill="url(#alley-bulb-glow)"/><ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.5" fill="#fff1bc" opacity=".4"/></g>`).join('')}</g>`;
}

function flower(x, y, color) {
  return `<g transform="translate(${x} ${y})"><path d="M0 0v12m0-5-5-3m5 5 5-5" stroke="#637449" stroke-width="2"/><circle cy="-1" r="4.5" fill="${color}"/><circle cy="-1" r="1.5" fill="#eedba1"/></g>`;
}

function communityImprovements(done) {
  const tavernHelp = done.has('project-tavern-bill') || done.has('project-pantry-ledger');
  const games = done.has('project-guessing-game') || done.has('project-festival-scores');
  const garden = done.has('project-plant-adviser');
  const lanterns = done.has('project-lantern-predictor');
  return `${tavernHelp ? `<g class="village-improvement"><ellipse cx="99" cy="321" rx="23" ry="7" fill="#282621" opacity=".25"/><path d="M81 298h37l-3 22H85Z" fill="#896b48"/><path d="M83 302h33m-31 7h29m-29 6h28m-22-16v20m8-20v20m8-20v20" stroke="#b49762" stroke-width="1.8"/>${[88, 99, 110].map((x, i) => `<circle cx="${x}" cy="${297 - i % 2 * 3}" r="6" fill="#b8714d"/><path d="M${x - 2} ${293 - i % 2 * 3}h3" stroke="#d9a46a" stroke-width="2"/>`).join('')}<path d="M109 286q-8 0-9 7m10-8q6 0 8 5" stroke="#647844" stroke-width="3"/><path d="M82 296h36v5H82Z" fill="#c1a474"/></g>` : ''}
    ${games ? `<g class="village-improvement"><ellipse cx="615" cy="252" rx="32" ry="9" fill="#252a26" opacity=".22"/><path d="M588 225h51v8h-51Zm4 8h5v21h-5Zm39 0h5v21h-5Z" fill="#76563e"/><path d="M590 225h47v3h-47" fill="#b49568"/><path d="M597 215h12v11h-12Zm18 1h11v10h-11Z" fill="#e2c889"/><g fill="#8e5d45"><circle cx="601" cy="219" r="1.2"/><circle cx="605" cy="222" r="1.2"/><circle cx="619" cy="220" r="1.3"/><circle cx="623" cy="223" r="1.3"/></g><path d="M588 226v-45h3v45Zm49 0v-45h3v45Z" fill="#685840"/><path d="M584 181h60l-7 13h-46Z" fill="#96795b"/><path d="M590 181h8l3 13h-10Zm15 0h9v13h-10Zm17 0h8l7 13h-11Z" fill="#ded2ab"/><path d="M599 199h30v12h-30Z" fill="#d5bb86"/><text x="614" y="207" text-anchor="middle" font-size="5" font-family="Georgia,serif" fill="#624d36" letter-spacing="1">PLAY</text></g>` : ''}
    ${garden ? `<g class="village-improvement"><ellipse cx="396" cy="477" rx="36" ry="8" fill="#292a23" opacity=".2"/><path d="M365 449h60l-5 26h-50Z" fill="#8a634b"/><path d="M366 449h58v7h-58Z" fill="#b68c62"/><path d="M375 457v16m13-16v16m13-16v16m13-16v16" stroke="#674a39" stroke-width="2"/><ellipse cx="395" cy="450" rx="27" ry="5" fill="#514535"/>${[374, 385, 398, 412].map((x, i) => flower(x, 443 - (i % 2) * 5, ['#c48b67', '#b4a080', '#d9b876', '#a9776c'][i])).join('')}</g>` : ''}
    ${lanterns ? [390, 455, 548, 619].map((x, index) => `<g class="village-improvement">${streetlamp(x, 550 - index * 22, index + 35, .55)}</g>`).join('') : ''}`;
}

export function sceneArt(projects) {
  return `<img class="village-backdrop" src="assets/hearthwick-evening.png" alt="" width="1536" height="1024" draggable="false" fetchpriority="high">
    <svg class="village-atmosphere" viewBox="0 0 1000 650" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="alley-ground-light"><stop stop-color="#ffd49a" stop-opacity=".30"/><stop offset=".42" stop-color="#e9b268" stop-opacity=".15"/><stop offset="1" stop-color="#ecb75e" stop-opacity="0"/></radialGradient>
        <radialGradient id="alley-bulb-glow"><stop stop-color="#fff2c7" stop-opacity=".62"/><stop offset=".15" stop-color="#ffdb94" stop-opacity=".32"/><stop offset=".46" stop-color="#f3b265" stop-opacity=".12"/><stop offset="1" stop-color="#f1bb79" stop-opacity="0"/></radialGradient>
        <radialGradient id="alley-window-glow"><stop stop-color="#ffdca8" stop-opacity=".32"/><stop offset=".52" stop-color="#edaf65" stop-opacity=".12"/><stop offset="1" stop-color="#e5b57f" stop-opacity="0"/></radialGradient>
        <linearGradient id="alley-cone-light" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f4cc8c" stop-opacity=".06"/><stop offset="1" stop-color="#edbc78" stop-opacity=".015"/></linearGradient>
        <linearGradient id="alley-window-spill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f0c88c" stop-opacity=".23"/><stop offset="1" stop-color="#eab46f" stop-opacity="0"/></linearGradient>
        <linearGradient id="alley-depth-wash" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c4ae89" stop-opacity=".025"/><stop offset=".52" stop-color="#5b5348" stop-opacity="0"/><stop offset="1" stop-color="#302d2a" stop-opacity=".035"/></linearGradient>
      </defs>
      <path d="M0 0h1000v650H0Z" fill="url(#alley-depth-wash)"/>
      <g class="alley-window-light alley-flicker" style="${glowStyle(18)}"><ellipse cx="271" cy="180" rx="67" ry="58" fill="url(#alley-window-glow)"/><ellipse cx="159" cy="175" rx="41" ry="63" fill="url(#alley-window-glow)"/><path d="M143 229h28l36 84H107Z" fill="url(#alley-window-spill)"/><ellipse cx="161" cy="276" rx="86" ry="38" fill="url(#alley-ground-light)"/></g>
      <g class="alley-window-light alley-flicker" style="${glowStyle(23)}"><ellipse cx="721" cy="174" rx="55" ry="55" fill="url(#alley-window-glow)"/><ellipse cx="865" cy="174" rx="49" ry="54" fill="url(#alley-window-glow)"/><path d="M782 237h33l45 75H745Z" fill="url(#alley-window-spill)"/></g>
      <g class="alley-water-reflections"><path d="M154 451h14m-17 5h21m32 26h22m-18 5h14M235 474h25m-21 6h16" stroke="#d6ba80" stroke-width="2" opacity=".28"/><path d="M477 305h15m14 6h14m-29 5h16" stroke="#e9d6ab" stroke-width="1.5" opacity=".30"/></g>
      ${existingLampGlow(33, 148, 33, 248, 3)}${existingLampGlow(56, 379, 56, 480, 9)}${existingLampGlow(926, 387, 926, 520, 15)}${existingLampGlow(949, 158, 946, 261, 17)}${existingLampGlow(611, 55, 615, 187, 21)}${existingLampGlow(374, 57, 373, 181, 24)}
      ${stringGlows()}
      ${communityImprovements(new Set(projects || []))}
    </svg>
    <span class="village-foreground-shade" aria-hidden="true"></span>`;
}
