// Every appearance comes from the same painted sheet, including conversation
// portraits. Crops are source rectangles, so they scale without editing the art.
import { dressedArt } from './wardrobe-art.js';
const ATLAS = { width: 1774, height: 887 };
const characters = Object.freeze({
  traveler: { label: 'Your Hearthwick adventurer', body: [40, 26, 375, 829], face: [104, 22, 265, 265] },
  rowan: { label: 'Rowan, the innkeeper', body: [450, 22, 470, 830], face: [552, 14, 260, 260] },
  mira: { label: 'Mira, the tinkerer', body: [940, 50, 350, 802], face: [980, 38, 280, 280] },
  elio: { label: 'Elio, the naturalist', body: [1370, 22, 380, 833], face: [1430, 10, 260, 260] }
});

function identity(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(characters, id) ? id : 'traveler';
}

function classTokens(value) {
  return typeof value === 'string' ? value.split(/\s+/).filter(token => /^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$/.test(token)).slice(0, 12).join(' ') : '';
}

function cropStyle([x, y, width, height]) {
  return `--character-ratio:${(width / height).toFixed(6)};--character-size:${(ATLAS.width / width * 100).toFixed(6)}% ${(ATLAS.height / height * 100).toFixed(6)}%;--character-position:${(x / (ATLAS.width - width) * 100).toFixed(6)}% ${(y / (ATLAS.height - height || 1) * 100).toFixed(6)}%`;
}

export function characterSprite(id = 'traveler', className = '', appearance = null) {
  if(id==='traveler'&&appearance)return `<span class="hearth-character character-traveler dressed-character ${classTokens(className)}" style="--character-ratio:.444444" aria-hidden="true">${dressedArt(appearance)}</span>`;
  const key = identity(id), character = characters[key];
  return `<span class="hearth-character character-${key} ${classTokens(className)}" style="${cropStyle(character.body)}" aria-hidden="true"><span class="hearth-character-art"></span></span>`;
}

export function characterPortrait(id = 'traveler', className = '', appearance = null) {
  if(id==='traveler'&&appearance)return `<span class="hearth-character hearth-character-portrait character-traveler dressed-character ${classTokens(className)}" role="img" aria-label="Your Hearthwick adventurer">${dressedArt(appearance,true)}</span>`;
  const key = identity(id), character = characters[key];
  return `<span class="hearth-character hearth-character-portrait character-${key} ${classTokens(className)}" style="${cropStyle(character.face)}" role="img" aria-label="${character.label}"><span class="hearth-character-art" aria-hidden="true"></span></span>`;
}
