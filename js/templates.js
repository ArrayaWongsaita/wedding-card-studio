// Card templates. Every template draws in a fixed 1200 x 1680 coordinate space;
// app.js scales the context for previews, thumbnails and downloads.
const CARD_W = 1200;
const CARD_H = 1680;

// Deterministic random so decorations look the same on every render.
function seededRandom(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function diamond(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
}

function flower(ctx, x, y, r, petals, color, center, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  for (let i = 0; i < petals; i++) {
    ctx.rotate((Math.PI * 2) / petals);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.38, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function leaf(ctx, x, y, len, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
  ctx.fill();
  ctx.restore();
}

// A stem with alternating leaves, growing from (x, y) in direction `angle`.
function sprig(ctx, x, y, len, angle, color, leaves = 7) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len, 0);
  ctx.stroke();
  for (let i = 1; i <= leaves; i++) {
    const px = (len * i) / (leaves + 1);
    const side = i % 2 ? -1 : 1;
    leaf(ctx, px, 0, len * 0.28 * (1 - i / (leaves + 4)), side * 0.75, color);
  }
  leaf(ctx, len, 0, len * 0.2, 0, color);
  ctx.restore();
}

// Eucalyptus: a curved stem with round leaves in pairs.
function eucalyptusBranch(ctx, x0, y0, cx, cy, x1, y1, pairs) {
  const point = (t) => ({
    x: (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1,
    y: (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1,
  });
  ctx.strokeStyle = "#7d968a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();

  const colors = ["#9db5a8", "#86a596", "#b5c9be"];
  for (let i = 1; i <= pairs; i++) {
    const t = i / (pairs + 0.5);
    const p = point(t);
    const q = point(Math.min(1, t + 0.01));
    const dir = Math.atan2(q.y - p.y, q.x - p.x);
    const r = 46 * (1 - t * 0.45);
    for (const side of [-1, 1]) {
      const a = dir + side * Math.PI / 2;
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = colors[(i + (side > 0 ? 1 : 0)) % colors.length];
      ctx.beginPath();
      ctx.ellipse(p.x + Math.cos(a) * r * 0.9, p.y + Math.sin(a) * r * 0.9, r, r * 0.82, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function floralCluster(ctx, x, y, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const greens = ["#9cb59b", "#7f9e83", "#b3c7a9"];
  [[200, 0.05], [240, 0.35], [180, 0.75], [220, 1.1], [160, 1.45]].forEach(([len, a], i) => {
    leaf(ctx, 0, 0, len, a, greens[i % greens.length]);
  });
  flower(ctx, 150, 150, 46, 5, "#f7dcd6", "#e9b7a7", 0.4);
  flower(ctx, 210, 50, 52, 6, "#f3c7c4", "#d98f8f", 0.2);
  flower(ctx, 40, 200, 56, 6, "#d77f8c", "#a84b5c", 0.8);
  flower(ctx, 60, 60, 80, 6, "#e8a0a8", "#b9606f");
  ctx.restore();
}

function lotus(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(i * 0.42);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.32, -size * 0.6, 0, -size * (i === 0 ? 1.15 : 0.95));
    ctx.quadraticCurveTo(-size * 0.32, -size * 0.6, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillRect(-size * 0.7, 6, size * 1.4, 5);
  ctx.restore();
}

function sparkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

// Repeats diamonds evenly along a straight line.
function diamondLine(ctx, x0, y0, x1, y1, spacing, r, color) {
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / spacing));
  for (let i = 0; i <= n; i++) {
    diamond(ctx, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, r, color);
  }
}

const TEMPLATES = [
  {
    id: "classic-gold",
    name: "คลาสสิกทอง",
    text: "#5a4632",
    accent: "#b08d57",
    maxWidth: 860,
    draw(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, CARD_H);
      g.addColorStop(0, "#fcf8ef");
      g.addColorStop(1, "#f1e4c9");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      ctx.strokeStyle = this.accent;
      ctx.lineWidth = 5;
      ctx.strokeRect(50, 50, CARD_W - 100, CARD_H - 100);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(72, 72, CARD_W - 144, CARD_H - 144);

      const corners = [[72, 72, 1, 1], [CARD_W - 72, 72, -1, 1], [72, CARD_H - 72, 1, -1], [CARD_W - 72, CARD_H - 72, -1, -1]];
      for (const [x, y, sx, sy] of corners) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(sx, sy);
        ctx.lineWidth = 2;
        for (const r of [90, 112]) {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI / 2);
          ctx.stroke();
        }
        diamond(ctx, 42, 42, 14, this.accent);
        ctx.restore();
      }

      ctx.lineWidth = 4;
      for (const dx of [-24, 24]) {
        ctx.beginPath();
        ctx.arc(CARD_W / 2 + dx, 310, 40, 0, Math.PI * 2);
        ctx.stroke();
      }
      diamond(ctx, CARD_W / 2, 248, 10, this.accent);
    },
  },
  {
    id: "blush-floral",
    name: "ดอกไม้ชมพู",
    text: "#6b3e46",
    accent: "#c97b84",
    maxWidth: 820,
    draw(ctx) {
      ctx.fillStyle = "#fbefee";
      ctx.fillRect(0, 0, CARD_W, CARD_H);
      roundRectPath(ctx, 90, 90, CARD_W - 180, CARD_H - 180, 40);
      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.fill();
      ctx.strokeStyle = "#e3b5b9";
      ctx.lineWidth = 2;
      ctx.stroke();
      floralCluster(ctx, 110, 110, 0);
      floralCluster(ctx, CARD_W - 110, CARD_H - 110, Math.PI);
    },
  },
  {
    id: "thai-red",
    name: "ไทยแดงทอง",
    text: "#f6dc95",
    accent: "#e2bf6b",
    maxWidth: 840,
    draw(ctx) {
      const g = ctx.createRadialGradient(CARD_W / 2, CARD_H / 2, 100, CARD_W / 2, CARD_H / 2, CARD_H * 0.75);
      g.addColorStop(0, "#9b1c1f");
      g.addColorStop(1, "#560b0e");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      const gold = this.accent;
      ctx.strokeStyle = gold;
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 40, CARD_W - 80, CARD_H - 80);
      ctx.strokeRect(100, 100, CARD_W - 200, CARD_H - 200);
      ctx.lineWidth = 1;
      ctx.strokeRect(116, 116, CARD_W - 232, CARD_H - 232);

      diamondLine(ctx, 70, 70, CARD_W - 70, 70, 40, 11, gold);
      diamondLine(ctx, 70, CARD_H - 70, CARD_W - 70, CARD_H - 70, 40, 11, gold);
      diamondLine(ctx, 70, 70, 70, CARD_H - 70, 40, 11, gold);
      diamondLine(ctx, CARD_W - 70, 70, CARD_W - 70, CARD_H - 70, 40, 11, gold);

      for (const [x, y] of [[100, 100], [CARD_W - 100, 100], [100, CARD_H - 100], [CARD_W - 100, CARD_H - 100]]) {
        flower(ctx, x, y, 44, 8, gold, "#7a1215");
      }
      lotus(ctx, CARD_W / 2, 330, 90, gold);
    },
  },
  {
    id: "sage-arch",
    name: "โค้งเขียวเสจ",
    text: "#3d4c38",
    accent: "#7d9473",
    maxWidth: 700,
    draw(ctx) {
      ctx.fillStyle = "#f6f4ee";
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      const arch = (inset) => {
        const left = 170 + inset, right = CARD_W - 170 - inset;
        const r = (right - left) / 2;
        ctx.beginPath();
        ctx.moveTo(left, 1520 - inset);
        ctx.lineTo(left, 610);
        ctx.arc(CARD_W / 2, 610, r, Math.PI, 0);
        ctx.lineTo(right, 1520 - inset);
        ctx.closePath();
      };
      arch(0);
      ctx.fillStyle = "#e4eadc";
      ctx.fill();
      arch(24);
      ctx.strokeStyle = this.accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      sprig(ctx, 150, 1540, 300, -1.05, this.accent);
      sprig(ctx, 150, 1540, 220, -0.35, "#9db091", 5);
      sprig(ctx, CARD_W - 150, 1540, 300, Math.PI + 1.05, this.accent);
      sprig(ctx, CARD_W - 150, 1540, 220, Math.PI + 0.35, "#9db091", 5);
    },
  },
  {
    id: "navy-night",
    name: "ราตรีน้ำเงิน",
    text: "#f3e6c4",
    accent: "#d9b86c",
    maxWidth: 860,
    draw(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, CARD_H);
      g.addColorStop(0, "#101a33");
      g.addColorStop(1, "#24376d");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      const rand = seededRandom(42);
      for (let i = 0; i < 160; i++) {
        ctx.globalAlpha = 0.25 + rand() * 0.6;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(rand() * CARD_W, rand() * CARD_H, 1 + rand() * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < 14; i++) {
        sparkle(ctx, 80 + rand() * (CARD_W - 160), 80 + rand() * (CARD_H - 160), 8 + rand() * 10, this.accent);
      }

      // Crescent moon: clip away an offset circle, then fill the full moon.
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, CARD_W, CARD_H);
      ctx.arc(CARD_W / 2 + 30, 290, 66, 0, Math.PI * 2, true);
      ctx.clip("evenodd");
      ctx.fillStyle = this.accent;
      ctx.beginPath();
      ctx.arc(CARD_W / 2, 310, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = this.accent;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(60, 60, CARD_W - 120, CARD_H - 120);
      for (const [x, y] of [[60, 60], [CARD_W - 60, 60], [60, CARD_H - 60], [CARD_W - 60, CARD_H - 60]]) {
        sparkle(ctx, x, y, 22, this.accent);
      }
    },
  },
  {
    id: "eucalyptus",
    name: "ยูคาลิปตัส",
    text: "#33473d",
    accent: "#7f9c8e",
    maxWidth: 820,
    draw(ctx) {
      ctx.fillStyle = "#fbfbf7";
      ctx.fillRect(0, 0, CARD_W, CARD_H);
      ctx.strokeStyle = "#c3d3c9";
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 60, CARD_W - 120, CARD_H - 120);

      eucalyptusBranch(ctx, -20, 380, 120, 120, 560, 70, 7);
      eucalyptusBranch(ctx, CARD_W + 20, 300, CARD_W - 60, 110, 760, 60, 5);
      eucalyptusBranch(ctx, -20, CARD_H - 230, 150, CARD_H - 60, 470, CARD_H - 50, 5);
      eucalyptusBranch(ctx, CARD_W + 20, CARD_H - 380, CARD_W - 110, CARD_H - 110, 660, CARD_H - 60, 7);
    },
  },
];

// Background from the customer's own photo; added to the gallery after an upload.
const CUSTOM_TEMPLATE = {
  id: "custom",
  name: "รูปของฉัน",
  text: "#3a2f2a",
  accent: "#a8834f",
  maxWidth: 740,
  image: null,
  draw(ctx) {
    ctx.fillStyle = "#e9e1d6";
    ctx.fillRect(0, 0, CARD_W, CARD_H);
    const img = this.image;
    if (img) {
      const scale = Math.max(CARD_W / img.width, CARD_H / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (CARD_W - w) / 2, (CARD_H - h) / 2, w, h);
    }
    roundRectPath(ctx, 150, 400, CARD_W - 300, 1150, 36);
    ctx.fillStyle = "rgba(255,253,249,.86)";
    ctx.fill();
    ctx.strokeStyle = this.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
  },
};
