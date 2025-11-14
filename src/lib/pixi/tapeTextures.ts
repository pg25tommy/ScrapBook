import { Texture } from 'pixi.js';

const CACHE = new Map<number, Texture>();

const TAPE_1 =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
  <defs>
    <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="t"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.05 0.12 0.08 0.05 0"/>
      </feComponentTransfer>
    </filter>
    <filter id="edge" x="-10%" y="-100%" width="120%" height="300%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="8" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <linearGradient id="paper" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#efe6cf"/>
      <stop offset="60%" stop-color="#e8ddc3"/>
      <stop offset="100%" stop-color="#e3d7bb"/>
    </linearGradient>
    <mask id="tornMask">
      <rect x="0" y="0" width="320" height="80" fill="white"/>
      <!-- chew out edges -->
      <g filter="url(#edge)">
        <rect x="-5" y="-20" width="330" height="25" fill="black"/>
        <rect x="-5" y="75" width="330" height="25" fill="black"/>
      </g>
    </mask>
  </defs>
  <g mask="url(#tornMask)">
    <rect width="320" height="80" fill="url(#paper)"/>
    <rect width="320" height="80" fill="#d9cdb2" opacity="0.12" filter="url(#grain)"/>
    <rect x="0" y="38" width="320" height="4" fill="#b5aa93" opacity="0.18"/>
  </g>
  <rect width="320" height="80" fill="none" stroke="#9e9278" stroke-opacity="0.18"/>
</svg>`);

const TAPE_2 =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
  <defs>
    <filter id="grain2" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="t"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.06 0.1 0.07 0.04 0"/>
      </feComponentTransfer>
    </filter>
    <filter id="edge2" x="-10%" y="-100%" width="120%" height="300%">
      <feTurbulence type="fractalNoise" baseFrequency="0.023" numOctaves="3" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <linearGradient id="paper2" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#f0e7d1"/>
      <stop offset="65%" stop-color="#eadfc7"/>
      <stop offset="100%" stop-color="#e6dabf"/>
    </linearGradient>
    <mask id="tornMask2">
      <rect x="0" y="0" width="320" height="80" fill="white"/>
      <g filter="url(#edge2)">
        <rect x="-5" y="-20" width="330" height="28" fill="black"/>
        <rect x="-5" y="72" width="330" height="28" fill="black"/>
      </g>
    </mask>
  </defs>
  <g mask="url(#tornMask2)">
    <rect width="320" height="80" fill="url(#paper2)"/>
    <rect width="320" height="80" fill="#d5cab0" opacity="0.12" filter="url(#grain2)"/>
    <rect x="-40" y="10" width="400" height="2" fill="#b5aa93" opacity="0.12" transform="rotate(8 160 40)"/>
    <rect x="-40" y="68" width="400" height="2" fill="#b5aa93" opacity="0.10" transform="rotate(-6 160 40)"/>
  </g>
  <rect width="320" height="80" fill="none" stroke="#9e9278" stroke-opacity="0.16"/>
</svg>`);

export function getTapeTexture(id: 1 | 2): Texture {
  if (CACHE.has(id)) return CACHE.get(id)!;
  const t = Texture.from(id === 1 ? TAPE_1 : TAPE_2);
  CACHE.set(id, t);
  return t;
}
