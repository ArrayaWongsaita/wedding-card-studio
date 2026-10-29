const AMP_FONT = "Playfair Display";
// Handwritten Thai fonts for the couple's names, with the weight to draw them at.
const NAME_FONTS = { Charm: 700, Charmonman: 700, Srisakdi: 700, Sriracha: 400, Mali: 600, Itim: 400 };
// Fonts for the detail lines: [regular, bold] weights.
const DETAIL_FONTS = { Sarabun: [400, 600], Mali: [400, 600], Itim: [400, 400], Sriracha: [400, 400] };
const STORAGE_KEY = "wedding-card-v1";
const THUMB_SCALE = 0.2;

const canvas = document.getElementById("card");
const ctx = canvas.getContext("2d");
const form = document.getElementById("form");
const gallery = document.getElementById("gallery");
const upload = document.getElementById("bg-upload");

const segmenter = "Segmenter" in Intl ? new Intl.Segmenter("th", { granularity: "word" }) : null;
const dateFormat = new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

let templates = [...TEMPLATES];
let selectedId = templates[0].id;
let thumbs = new Map();
let renderQueued = false;

// ---------- Text helpers ----------

function setFont(ctx, weight, size, family) {
  ctx.font = `${weight} ${size}px "${family}", serif`;
}

// Draws one centered line, shrinking the font until it fits maxWidth.
function fitText(ctx, text, x, y, size, weight, family, maxWidth) {
  if (!text) return;
  let s = size;
  setFont(ctx, weight, s, family);
  while (ctx.measureText(text).width > maxWidth && s > 12) {
    s -= 2;
    setFont(ctx, weight, s, family);
  }
  ctx.fillText(text, x, y);
}

// Word-wraps text (Thai has no spaces, so split on word segments when possible).
function wrapLines(ctx, text, maxWidth, maxLines) {
  const lines = [];
  for (const para of text.split("\n")) {
    const parts = segmenter ? [...segmenter.segment(para)].map((s) => s.segment) : [...para];
    let line = "";
    for (const part of parts) {
      const next = line + part;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line.trim());
        line = part.trimStart();
      } else {
        line = next;
      }
    }
    if (line.trim()) lines.push(line.trim());
  }
  return lines.slice(0, maxLines);
}

function formatDate(value) {
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  return dateFormat.format(new Date(y, m - 1, d));
}

function divider(ctx, x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 170, y);
  ctx.lineTo(x - 26, y);
  ctx.moveTo(x + 26, y);
  ctx.lineTo(x + 170, y);
  ctx.stroke();
  diamond(ctx, x, y, 11, color);
  diamond(ctx, x - 190, y, 5, color);
  diamond(ctx, x + 190, y, 5, color);
}

// ---------- Rendering ----------

function drawContent(ctx, t, d) {
  const cx = CARD_W / 2;
  const maxW = t.maxWidth;
  const nameFont = d.nameFont in NAME_FONTS ? d.nameFont : "Charm";
  const nameWeight = NAME_FONTS[nameFont];
  const detailFont = d.detailFont in DETAIL_FONTS ? d.detailFont : "Sarabun";
  const [regular, bold] = DETAIL_FONTS[detailFont];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = t.text;
  fitText(ctx, d.heading, cx, 486, 44, regular, detailFont, maxW);
  fitText(ctx, d.bride, cx, 645, 120, nameWeight, nameFont, maxW);
  ctx.fillStyle = t.accent;
  fitText(ctx, "&", cx, 778, 70, "italic 400", AMP_FONT, maxW);
  ctx.fillStyle = t.text;
  fitText(ctx, d.groom, cx, 925, 120, nameWeight, nameFont, maxW);

  divider(ctx, cx, 1040, t.accent);

  ctx.fillStyle = t.text;
  fitText(ctx, formatDate(d.date), cx, 1118, 46, bold, detailFont, maxW);
  fitText(ctx, d.time, cx, 1184, 40, regular, detailFont, maxW);

  setFont(ctx, regular, 38, detailFont);
  wrapLines(ctx, d.venue, maxW, 3).forEach((line, i) => {
    ctx.fillText(line, cx, 1260 + i * 54);
  });

  ctx.fillStyle = t.accent;
  fitText(ctx, d.note, cx, 1460, 52, nameWeight === 700 ? 400 : nameWeight, nameFont, maxW);
}

function renderCard(ctx, t, d, scale) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  ctx.save();
  t.draw(ctx);
  ctx.restore();
  drawContent(ctx, t, d);
}

function readForm() {
  return Object.fromEntries(new FormData(form));
}

function currentTemplate() {
  return templates.find((t) => t.id === selectedId) || templates[0];
}

function renderAll() {
  renderQueued = false;
  const data = readForm();
  renderCard(ctx, currentTemplate(), data, canvas.width / CARD_W);
  for (const el of form.querySelectorAll(".name-sample")) {
    el.textContent = data.bride || "ปิยะนุช";
  }
  for (const t of templates) {
    const thumb = thumbs.get(t.id);
    if (thumb) renderCard(thumb.getContext("2d"), t, data, THUMB_SCALE);
  }
}

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(renderAll);
}

// ---------- Gallery ----------

function buildGallery() {
  gallery.innerHTML = "";
  thumbs = new Map();
  for (const t of templates) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(t.id === selectedId));
    btn.dataset.id = t.id;

    const thumb = document.createElement("canvas");
    thumb.width = CARD_W * THUMB_SCALE;
    thumb.height = CARD_H * THUMB_SCALE;
    thumbs.set(t.id, thumb);

    const label = document.createElement("span");
    label.textContent = t.name;

    btn.append(thumb, label);
    gallery.append(btn);
  }
}

function selectTemplate(id) {
  selectedId = id;
  for (const btn of gallery.querySelectorAll(".tile")) {
    btn.setAttribute("aria-checked", String(btn.dataset.id === id));
  }
  save();
  scheduleRender();
}

gallery.addEventListener("click", (e) => {
  const btn = e.target.closest(".tile");
  if (btn) selectTemplate(btn.dataset.id);
});

upload.addEventListener("change", () => {
  const file = upload.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      CUSTOM_TEMPLATE.image = img;
      if (!templates.includes(CUSTOM_TEMPLATE)) {
        templates = [CUSTOM_TEMPLATE, ...TEMPLATES];
        buildGallery();
      }
      selectTemplate(CUSTOM_TEMPLATE.id);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  upload.value = "";
});

// ---------- Download ----------

function fileName(ext) {
  const { bride, groom } = readForm();
  const names = [bride, groom].filter(Boolean).join("-").replace(/[\\/:*?"<>|\s]+/g, "-");
  return `wedding-card${names ? "-" + names : ""}.${ext}`;
}

function download(type) {
  renderAll();
  const ext = type === "image/jpeg" ? "jpg" : "png";
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName(ext);
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, type, 0.95);
}

document.querySelectorAll("[data-download]").forEach((btn) => {
  btn.addEventListener("click", () => download(btn.dataset.download));
});

// ---------- Persistence (best effort; the page works without it) ----------

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ template: selectedId, data: readForm() }));
  } catch {}
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;
    for (const [name, value] of Object.entries(saved.data || {})) {
      if (form.elements[name]) form.elements[name].value = value;
    }
    if (TEMPLATES.some((t) => t.id === saved.template)) selectedId = saved.template;
  } catch {}
}

form.addEventListener("input", () => {
  save();
  scheduleRender();
});

// ---------- Init ----------

restore();
buildGallery();
renderAll();

// Canvas only uses web fonts once loaded; the sample text pulls in the Thai and Latin subsets.
const sample = "กขค abc &";
const fontsToLoad = [`italic 400 40px "${AMP_FONT}"`];
for (const [family, weight] of Object.entries(NAME_FONTS)) {
  fontsToLoad.push(`${weight} 40px "${family}"`, `400 40px "${family}"`);
}
for (const [family, weights] of Object.entries(DETAIL_FONTS)) {
  for (const weight of weights) fontsToLoad.push(`${weight} 40px "${family}"`);
}
Promise.all(fontsToLoad.map((f) => document.fonts.load(f, sample))).finally(renderAll);
