import { icon, sprite } from './art.js';
import { rewardChest } from './cozy-art.js';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function celebrationMarkup({ xp = 0, coins = 0, companion = 'pip', name = 'Pip', level = null, adoption = false, daily = false, achievements = [] } = {}) {
  const title = adoption ? `${name} found a home!` : level ? `Hello, level ${level}!` : daily ? 'A little spark, well earned.' : 'You did it!';
  const palette = ['#db775f', '#e9bb49', '#6caa8b', '#87b3c8', '#a899c4'];
  return `<div class="celebration-sprinkles" aria-hidden="true">${Array.from({ length: 26 }, (_, i) => `<i class="celebration-piece piece-${i % 3}" style="--x:${(i * 37) % 100}%;--drift:${(i % 2 ? 1 : -1) * (18 + (i * 13) % 80)}px;--turn:${120 + (i * 47) % 350}deg;--delay:${(i % 7) * .07}s;--color:${palette[i % palette.length]}"></i>`).join('')}</div>
    <div class="celebration-graphic" aria-hidden="true">${rewardChest()}<span class="celebration-friend">${sprite(companion)}</span><span class="celebration-heart">♥</span></div>
    <div class="celebration-copy"><strong>${escape(title)}</strong><span>${adoption ? 'A new friend for the road ahead.' : `${escape(name)} is doing a little happy dance.`}</span><div class="celebration-rewards">${xp ? `<span>${icon('spark')} +${xp} XP</span>` : ''}${coins ? `<span>${icon('coin')} +${coins} coins</span>` : ''}</div>${achievements.length ? `<small>${icon('trophy')} ${achievements.map(a => escape(a.name)).join(' · ')}</small>` : ''}</div>
    <button class="celebration-close" type="button" aria-label="Dismiss celebration">${icon('close')}</button>`;
}

// Visual feedback only. Reward persistence is completed by the caller first.
// One timer, one media listener, and no animation loop survive dismissal.
export function showCelebration(options = {}, { parent = document.body, reducedMotion = false } = {}) {
  const card = document.createElement('div');
  card.className = 'completion-celebration';
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');
  card.innerHTML = celebrationMarkup(options);
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const syncMotion = () => card.classList.toggle('still', reducedMotion || media.matches);
  syncMotion();
  const close = card.querySelector('.celebration-close');
  let disposed = false;
  const timer = setTimeout(dispose, reducedMotion || media.matches ? 4200 : 4800);
  function dispose() {
    if (disposed) return;
    disposed = true;
    clearTimeout(timer);
    media.removeEventListener('change', syncMotion);
    close.removeEventListener('click', dispose);
    card.remove();
  }
  media.addEventListener('change', syncMotion);
  close.addEventListener('click', dispose);
  parent.append(card);
  return { dispose, parent };
}
