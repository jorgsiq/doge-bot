import { createCanvas, loadImage } from '@napi-rs/canvas';
import gifenc from 'gifenc';
import config from '../config.js';

const { GIFEncoder, applyPalette, quantize } = gifenc;

const WIDTH = 480;
const HEIGHT = 200;
const RADIUS = 72;
const CENTERS = [105, WIDTH - 105];
const FRAMES = 12;
const FRAME_MS = 70;

async function loadAvatar(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error(`avatar responded with ${response.status}`);
    return await loadImage(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Failed to load an avatar for /ship:', error.message);
    return null;
  }
}

function drawAvatar(ctx, image, cx) {
  const cy = HEIGHT / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
  ctx.clip();
  if (image) ctx.drawImage(image, cx - RADIUS, cy - RADIUS, RADIUS * 2, RADIUS * 2);
  else {
    // an avatar that could not be loaded still leaves its seat
    ctx.fillStyle = config.colors.grey;
    ctx.fill();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

function drawHeart(ctx, size) {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2 + size * 0.05;
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.35, cy + s * 0.05, cx - s * 0.95, cy - s * 1.05, cx, cy - s * 0.4);
  ctx.bezierCurveTo(cx + s * 0.95, cy - s * 1.05, cx + s * 1.35, cy + s * 0.05, cx, cy + s * 0.9);
  ctx.closePath();
  ctx.fillStyle = '#e8344e';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

// Both avatars in circles with a heart beating between them, as a looping GIF
export async function shipImage(avatarUrlA, avatarUrlB) {
  const avatars = await Promise.all([avatarUrlA, avatarUrlB].map(loadAvatar));

  const base = createCanvas(WIDTH, HEIGHT);
  const baseCtx = base.getContext('2d');
  baseCtx.fillStyle = config.colors.doge;
  baseCtx.fillRect(0, 0, WIDTH, HEIGHT);
  avatars.forEach((image, i) => drawAvatar(baseCtx, image, CENTERS[i]));

  const frame = createCanvas(WIDTH, HEIGHT);
  const ctx = frame.getContext('2d');
  const render = (i) => {
    ctx.drawImage(base, 0, 0);
    // one beat per loop: grows and shrinks around its resting size
    drawHeart(ctx, 84 * (1 + 0.18 * Math.sin((i / FRAMES) * Math.PI * 2)));
    return ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
  };

  // a single palette, taken from the frame with the biggest heart, keeps the avatars from flickering
  const palette = quantize(render(FRAMES / 4), 256);
  const gif = GIFEncoder();
  for (let i = 0; i < FRAMES; i++) {
    gif.writeFrame(applyPalette(render(i), palette), WIDTH, HEIGHT, { palette, delay: FRAME_MS, repeat: 0 });
  }
  gif.finish();
  return Buffer.from(gif.bytes());
}
