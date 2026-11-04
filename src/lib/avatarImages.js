import { Path2D, createCanvas, loadImage } from '@napi-rs/canvas';
import gifenc from 'gifenc';
import config from '../config.js';

const { GIFEncoder, applyPalette, quantize } = gifenc;

// Two avatars side by side in rings, with a badge between them: /ship's beating heart, the avatar log's arrow

// the bot's cream, the red of the Đoge's collar and Discord's blurple, on black
const COLORS = {
  background: '#000000',
  ring: config.colors.doge,
  halo: 'rgba(239, 227, 202, 0.14)',
  heartBadge: '#cc6054',
  arrowBadge: '#5865f2',
  icon: '#ffffff',
};

const WIDTH = 420;
const HEIGHT = 200;
const CY = HEIGHT / 2;
const RADIUS = 74;
const RING = 7;
const HALO = 9;
// close enough for the badge between them to cut into both rings
const CENTERS = [WIDTH / 2 - 95, WIDTH / 2 + 95];
const BADGE = 34;
// the gap around the badge, in the background color
const BADGE_BORDER = 6;

// icons in a 24×24 box, from Material Design: "favorite" and "arrow_forward"
const HEART = new Path2D(
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
);
const ARROW = new Path2D('M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z');

// a heartbeat: a strong beat, a softer one, then a rest
const BEAT = [1, 1.14, 1.26, 1.14, 1.04, 1.12, 1.18, 1.08, 1.02, 1, 1, 1, 1, 1, 1, 1];
const FRAME_MS = 65;

async function loadAvatar(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error(`avatar responded with ${response.status}`);
    return await loadImage(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Failed to load an avatar:', error.message);
    return null;
  }
}

function circle(ctx, cx, cy, radius, color) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawAvatar(ctx, image, cx) {
  circle(ctx, cx, CY, RADIUS + RING + HALO, COLORS.halo);
  circle(ctx, cx, CY, RADIUS + RING, COLORS.ring);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, CY, RADIUS, 0, Math.PI * 2);
  ctx.clip();
  if (image) ctx.drawImage(image, cx - RADIUS, CY - RADIUS, RADIUS * 2, RADIUS * 2);
  else {
    // an avatar that could not be loaded (say, an old one Discord already deleted) still leaves its seat
    ctx.fillStyle = config.colors.grey;
    ctx.fill();
  }
  ctx.restore();
}

// The background, both avatars and the empty badge
async function drawPair(avatarUrlA, avatarUrlB, badgeColor) {
  const avatars = await Promise.all([avatarUrlA, avatarUrlB].map(loadAvatar));
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  avatars.forEach((image, i) => drawAvatar(ctx, image, CENTERS[i]));
  circle(ctx, WIDTH / 2, CY, BADGE + BADGE_BORDER, COLORS.background);
  circle(ctx, WIDTH / 2, CY, BADGE, badgeColor);
  return canvas;
}

// `nudge` moves the icon up, as a share of its size
function drawIcon(ctx, icon, color, size, nudge = 0) {
  ctx.save();
  ctx.translate(WIDTH / 2 - size / 2, CY - size / 2 - size * nudge);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = color;
  ctx.fill(icon);
  ctx.restore();
}

// Both avatars with a heart beating between them, as a looping GIF
export async function shipImage(avatarUrlA, avatarUrlB) {
  const base = await drawPair(avatarUrlA, avatarUrlB, COLORS.heartBadge);

  const frame = createCanvas(WIDTH, HEIGHT);
  const ctx = frame.getContext('2d');
  const render = (scale) => {
    ctx.drawImage(base, 0, 0);
    // the heart sits a little low in its box
    drawIcon(ctx, HEART, COLORS.icon, BADGE * 1.15 * scale, 0.02);
    return ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
  };

  // a single palette, taken from the frame with the biggest heart, keeps the avatars from flickering
  const palette = quantize(render(Math.max(...BEAT)), 256);
  const gif = GIFEncoder();
  for (const scale of BEAT) {
    gif.writeFrame(applyPalette(render(scale), palette), WIDTH, HEIGHT, { palette, delay: FRAME_MS, repeat: 0 });
  }
  gif.finish();
  return Buffer.from(gif.bytes());
}

// The old avatar on the left, an arrow, and the new one on the right, as a PNG
export async function avatarChangeImage(beforeUrl, afterUrl) {
  const canvas = await drawPair(beforeUrl, afterUrl, COLORS.arrowBadge);
  drawIcon(canvas.getContext('2d'), ARROW, COLORS.icon, BADGE * 1.3);
  return canvas.toBuffer('image/png');
}
