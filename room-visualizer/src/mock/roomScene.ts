// ============================================================
// モック用 室内シーンレンダラー
// ------------------------------------------------------------
// 本アプリの思想（窓位置・柱・梁・ドア・間取り・撮影アングルは変えず、
// 家具・内装・床・壁・照明だけを変える）をモックでも再現するため、
// 「同じ部屋の骨格（ジオメトリ）」を共通化し、
// 仕上げ（パレット）と家具（フィーチャー）だけを差し替えてSVGを描画する。
//
// → 生成結果は全スタイルで窓・壁・間取り・アングルが完全に一致する。
// ============================================================

export interface ScenePalette {
  ceiling: string;
  wallBack: string;
  wallLeft: string;
  wallRight: string;
  accentWall?: string;
  floor: string;
  floorLine: string;
  baseboard: string;
  fabric: string;
  fabricDark: string;
  cushion: string;
  wood: string;
  woodDark: string;
  metal: string;
  rug: string;
  rugLine: string;
  curtain: string;
  curtainSheer: string;
  art1: string;
  art2: string;
  /** 全体の光の色味（暖色/寒色） */
  lightTone: string;
  lightStrength: number;
}

export type SceneFeature =
  | 'sofa'
  | 'table'
  | 'rug'
  | 'plant'
  | 'curtain'
  | 'tv'
  | 'dining'
  | 'bed'
  | 'storage'
  | 'art'
  | 'smallItems'
  | 'desk'
  | 'kidsToy'
  | 'lowTable';

export type LightingType = 'none' | 'ceiling' | 'downlight' | 'pendant';

export interface SceneOptions {
  palette: ScenePalette;
  features: SceneFeature[];
  lighting: LightingType;
  /** 和室（畳）表現にするか */
  tatami?: boolean;
  /** 空室（元画像）として描画するか */
  empty?: boolean;
  /**
   * 'full'     : 部屋の骨格ごと描画（サンプル物件用）
   * 'furniture': 家具レイヤーのみ透過で描画（アップロード写真への重ね合わせ用）
   */
  mode?: 'full' | 'furniture';
}

// ------------------------------------------------------------
// 部屋の骨格（全スタイル共通・絶対に変えない）
// ------------------------------------------------------------
const W = 1200;
const H = 800;
/** 奥の壁 */
const BACK = { x0: 270, x1: 930, y0: 170, y1: 540 };
/** 消失点 */
const VP = { x: 600, y: 355 };
/** 窓（引き違いの掃き出し窓） */
const WIN = { x0: 585, x1: 895, y0: 215, y1: 470 };
/** ドア（左壁） */
const DOOR = { d0: 0.52, d1: 0.86 };

/** 床面の座標系: u=左右(0-1), d=奥行き(0=奥の壁, 1=手前) */
function floorPoint(u: number, d: number) {
  const y = BACK.y1 + (H - BACK.y1) * d;
  const xL = BACK.x0 - BACK.x0 * d;
  const xR = BACK.x1 + (W - BACK.x1) * d;
  return { x: xL + (xR - xL) * u, y, scale: (xR - xL) / (BACK.x1 - BACK.x0) };
}

const n = (v: number) => Math.round(v * 10) / 10;

// ------------------------------------------------------------
// パーツ描画
// ------------------------------------------------------------
function shadow(cx: number, cy: number, rx: number, ry: number, op = 0.16) {
  return `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="#1d2a24" opacity="${op}" filter="url(#soft)"/>`;
}

function sofa(p: ScenePalette) {
  const a = floorPoint(0.3, 0.52);
  const s = a.scale * 0.42;
  const w = 620 * s;
  const seatH = 120 * s;
  const backH = 150 * s;
  const armW = 62 * s;
  const x = a.x - w / 2;
  const yBase = a.y;
  const yBack = yBase - seatH - backH;
  const cushionW = (w - armW * 2) / 3;
  let out = shadow(a.x, yBase + 6 * s, w * 0.56, 22 * s);
  out += `<rect x="${n(x + armW * 0.4)}" y="${n(yBack)}" width="${n(w - armW * 0.8)}" height="${n(backH + 20 * s)}" rx="${n(16 * s)}" fill="${p.fabricDark}"/>`;
  for (let i = 0; i < 3; i++) {
    out += `<rect x="${n(x + armW + i * cushionW + 6 * s)}" y="${n(yBack + 12 * s)}" width="${n(cushionW - 12 * s)}" height="${n(backH - 6 * s)}" rx="${n(12 * s)}" fill="${p.fabric}"/>`;
  }
  out += `<rect x="${n(x)}" y="${n(yBase - seatH)}" width="${n(w)}" height="${n(seatH)}" rx="${n(14 * s)}" fill="${p.fabric}"/>`;
  out += `<rect x="${n(x)}" y="${n(yBase - seatH - backH * 0.55)}" width="${n(armW)}" height="${n(seatH + backH * 0.55)}" rx="${n(14 * s)}" fill="${p.fabricDark}"/>`;
  out += `<rect x="${n(x + w - armW)}" y="${n(yBase - seatH - backH * 0.55)}" width="${n(armW)}" height="${n(seatH + backH * 0.55)}" rx="${n(14 * s)}" fill="${p.fabricDark}"/>`;
  // クッション
  out += `<rect x="${n(x + armW + 14 * s)}" y="${n(yBase - seatH - 70 * s)}" width="${n(86 * s)}" height="${n(86 * s)}" rx="${n(12 * s)}" fill="${p.cushion}" transform="rotate(-6 ${n(x + armW + 57 * s)} ${n(yBase - seatH - 27 * s)})"/>`;
  out += `<rect x="${n(x + w - armW - 100 * s)}" y="${n(yBase - seatH - 70 * s)}" width="${n(86 * s)}" height="${n(86 * s)}" rx="${n(12 * s)}" fill="${p.cushion}" transform="rotate(7 ${n(x + w - armW - 57 * s)} ${n(yBase - seatH - 27 * s)})"/>`;
  // 脚
  out += `<rect x="${n(x + armW * 0.6)}" y="${n(yBase - 4 * s)}" width="${n(16 * s)}" height="${n(22 * s)}" fill="${p.woodDark}"/>`;
  out += `<rect x="${n(x + w - armW * 0.6 - 16 * s)}" y="${n(yBase - 4 * s)}" width="${n(16 * s)}" height="${n(22 * s)}" fill="${p.woodDark}"/>`;
  return out;
}

function lowTable(p: ScenePalette, u = 0.47, d = 0.78, mul = 1) {
  const a = floorPoint(u, d);
  const s = a.scale * 0.34 * mul;
  const w = 430 * s;
  const topH = 22 * s;
  const legH = 96 * s;
  const x = a.x - w / 2;
  const yTop = a.y - legH - topH;
  let out = shadow(a.x, a.y + 4 * s, w * 0.52, 20 * s, 0.14);
  out += `<rect x="${n(x + w * 0.1)}" y="${n(a.y - legH)}" width="${n(14 * s)}" height="${n(legH)}" fill="${p.woodDark}"/>`;
  out += `<rect x="${n(x + w * 0.9 - 14 * s)}" y="${n(a.y - legH)}" width="${n(14 * s)}" height="${n(legH)}" fill="${p.woodDark}"/>`;
  out += `<rect x="${n(x)}" y="${n(yTop)}" width="${n(w)}" height="${n(topH)}" rx="${n(8 * s)}" fill="${p.wood}"/>`;
  out += `<rect x="${n(x)}" y="${n(yTop)}" width="${n(w)}" height="${n(topH * 0.4)}" rx="${n(8 * s)}" fill="#ffffff" opacity="0.18"/>`;
  return out;
}

function rug(p: ScenePalette) {
  const front = floorPoint(0.5, 0.95);
  const back = floorPoint(0.5, 0.55);
  const wF = 740 * front.scale * 0.42;
  const wB = 560 * back.scale * 0.42;
  const pts = [
    [front.x - wF / 2, front.y],
    [front.x + wF / 2, front.y],
    [back.x + wB / 2, back.y],
    [back.x - wB / 2, back.y],
  ]
    .map(([x, y]) => `${n(x)},${n(y)}`)
    .join(' ');
  let out = `<polygon points="${pts}" fill="${p.rug}"/>`;
  out += `<polygon points="${pts}" fill="none" stroke="${p.rugLine}" stroke-width="6" opacity="0.7"/>`;
  return out;
}

function plant(u: number, d: number, p: ScenePalette, size = 1) {
  const a = floorPoint(u, d);
  const s = a.scale * 0.42 * size;
  const potW = 110 * s;
  const potH = 120 * s;
  const x = a.x;
  const y = a.y;
  let out = shadow(x, y + 4 * s, potW * 0.8, 16 * s, 0.14);
  out += `<path d="M${n(x - potW / 2)},${n(y - potH)} L${n(x + potW / 2)},${n(y - potH)} L${n(x + potW * 0.36)},${n(y)} L${n(x - potW * 0.36)},${n(y)} Z" fill="${p.wood}"/>`;
  out += `<rect x="${n(x - potW / 2)}" y="${n(y - potH)}" width="${n(potW)}" height="${n(14 * s)}" fill="${p.woodDark}" opacity="0.6"/>`;
  const leaf = (ang: number, len: number, wid: number, col: string) =>
    `<path d="M${n(x)},${n(y - potH)} q${n(Math.sin((ang * Math.PI) / 180) * len * 0.5 - wid)},${n(-len * 0.55)} ${n(Math.sin((ang * Math.PI) / 180) * len)},${n(-len * 0.95)} q${n(wid)},${n(len * 0.45)} ${n(-Math.sin((ang * Math.PI) / 180) * len)},${n(len * 0.95)} Z" fill="${col}"/>`;
  out += leaf(-38, 250 * s, 34 * s, '#3f6b4f');
  out += leaf(-14, 300 * s, 36 * s, '#4c8059');
  out += leaf(12, 285 * s, 34 * s, '#3d6e4d');
  out += leaf(36, 235 * s, 32 * s, '#57906a');
  return out;
}

function tvBoard(p: ScenePalette) {
  const a = floorPoint(0.82, 0.3);
  const s = a.scale * 0.36;
  const w = 460 * s;
  const h = 120 * s;
  const x = a.x - w / 2;
  const y = a.y;
  let out = shadow(a.x, y + 4 * s, w * 0.5, 14 * s, 0.13);
  out += `<rect x="${n(x)}" y="${n(y - h)}" width="${n(w)}" height="${n(h)}" rx="${n(8 * s)}" fill="${p.wood}"/>`;
  out += `<line x1="${n(x + 10 * s)}" y1="${n(y - h * 0.45)}" x2="${n(x + w - 10 * s)}" y2="${n(y - h * 0.45)}" stroke="${p.woodDark}" stroke-width="${n(3 * s)}" opacity="0.6"/>`;
  const tvW = w * 0.92;
  const tvH = tvW * 0.56;
  out += `<rect x="${n(a.x - tvW / 2)}" y="${n(y - h - tvH - 14 * s)}" width="${n(tvW)}" height="${n(tvH)}" rx="${n(6 * s)}" fill="#20262b"/>`;
  out += `<rect x="${n(a.x - tvW / 2 + 6 * s)}" y="${n(y - h - tvH - 8 * s)}" width="${n(tvW - 12 * s)}" height="${n(tvH - 12 * s)}" fill="#33404a"/>`;
  out += `<rect x="${n(a.x - 20 * s)}" y="${n(y - h - 16 * s)}" width="${n(40 * s)}" height="${n(16 * s)}" fill="#20262b"/>`;
  return out;
}

function storage(p: ScenePalette) {
  const a = floorPoint(0.06, 0.22);
  const s = a.scale * 0.36;
  const w = 250 * s;
  const h = 420 * s;
  const x = a.x - w * 0.2;
  const y = a.y;
  let out = shadow(x + w / 2, y + 4 * s, w * 0.55, 12 * s, 0.13);
  out += `<rect x="${n(x)}" y="${n(y - h)}" width="${n(w)}" height="${n(h)}" rx="${n(6 * s)}" fill="${p.wood}"/>`;
  for (let i = 1; i < 4; i++) {
    out += `<line x1="${n(x)}" y1="${n(y - (h / 4) * i)}" x2="${n(x + w)}" y2="${n(y - (h / 4) * i)}" stroke="${p.woodDark}" stroke-width="${n(4 * s)}" opacity="0.55"/>`;
  }
  out += `<rect x="${n(x + w * 0.15)}" y="${n(y - h * 0.94)}" width="${n(w * 0.3)}" height="${n(h * 0.14)}" fill="${p.art2}" opacity="0.85"/>`;
  out += `<rect x="${n(x + w * 0.55)}" y="${n(y - h * 0.9)}" width="${n(w * 0.26)}" height="${n(h * 0.1)}" fill="${p.cushion}" opacity="0.9"/>`;
  return out;
}

function diningSet(p: ScenePalette, u = 0.5, d = 0.62, mul = 1) {
  const a = floorPoint(u, d);
  const s = a.scale * 0.36 * mul;
  const w = 560 * s;
  const topH = 20 * s;
  const legH = 150 * s;
  const x = a.x - w / 2;
  const yTop = a.y - legH - topH;
  let out = shadow(a.x, a.y + 6 * s, w * 0.6, 26 * s, 0.14);
  // 奥の椅子
  const chair = (cx: number, baseY: number, cs: number, back: boolean) => {
    const cw = 110 * cs;
    const sh = 90 * cs;
    const bh = 130 * cs;
    let c = `<rect x="${n(cx - cw / 2)}" y="${n(baseY - sh - bh)}" width="${n(cw)}" height="${n(bh)}" rx="${n(8 * cs)}" fill="${back ? p.fabricDark : p.fabric}"/>`;
    c += `<rect x="${n(cx - cw / 2)}" y="${n(baseY - sh)}" width="${n(cw)}" height="${n(22 * cs)}" rx="${n(6 * cs)}" fill="${p.wood}"/>`;
    c += `<rect x="${n(cx - cw / 2 + 8 * cs)}" y="${n(baseY - sh + 20 * cs)}" width="${n(12 * cs)}" height="${n(sh - 20 * cs)}" fill="${p.woodDark}"/>`;
    c += `<rect x="${n(cx + cw / 2 - 20 * cs)}" y="${n(baseY - sh + 20 * cs)}" width="${n(12 * cs)}" height="${n(sh - 20 * cs)}" fill="${p.woodDark}"/>`;
    return c;
  };
  const backRow = floorPoint(u, d - 0.14);
  out += chair(backRow.x - 130 * s, backRow.y, s * 0.92, true);
  out += chair(backRow.x + 130 * s, backRow.y, s * 0.92, true);
  out += `<rect x="${n(x + w * 0.08)}" y="${n(a.y - legH)}" width="${n(16 * s)}" height="${n(legH)}" fill="${p.woodDark}"/>`;
  out += `<rect x="${n(x + w * 0.92 - 16 * s)}" y="${n(a.y - legH)}" width="${n(16 * s)}" height="${n(legH)}" fill="${p.woodDark}"/>`;
  out += `<rect x="${n(x)}" y="${n(yTop)}" width="${n(w)}" height="${n(topH)}" rx="${n(6 * s)}" fill="${p.wood}"/>`;
  out += `<rect x="${n(x)}" y="${n(yTop)}" width="${n(w)}" height="${n(topH * 0.4)}" fill="#ffffff" opacity="0.2"/>`;
  const frontRow = floorPoint(u, d + 0.2);
  out += chair(frontRow.x - 150 * s, frontRow.y, s * 1.12, false);
  out += chair(frontRow.x + 150 * s, frontRow.y, s * 1.12, false);
  return out;
}

function bed(p: ScenePalette) {
  const head = floorPoint(0.42, 0.34);
  const foot = floorPoint(0.42, 0.86);
  const s = head.scale * 0.42;
  const wH = 560 * s;
  const wF = 560 * foot.scale * 0.42;
  const mat = 70 * s;
  let out = shadow((head.x + foot.x) / 2, foot.y + 4 * s, wF * 0.55, 22 * s, 0.14);
  // ヘッドボード
  out += `<rect x="${n(head.x - wH / 2)}" y="${n(head.y - 250 * s)}" width="${n(wH)}" height="${n(200 * s)}" rx="${n(12 * s)}" fill="${p.fabricDark}"/>`;
  // マットレス（奥→手前の台形）
  const pts = [
    [head.x - wH / 2, head.y - mat],
    [head.x + wH / 2, head.y - mat],
    [foot.x + wF / 2, foot.y - mat * 1.5],
    [foot.x - wF / 2, foot.y - mat * 1.5],
  ]
    .map(([x, y]) => `${n(x)},${n(y)}`)
    .join(' ');
  out += `<polygon points="${pts}" fill="${p.fabric}"/>`;
  // 掛け布団
  const dPts = [
    [head.x - wH / 2, head.y + 40 * s],
    [head.x + wH / 2, head.y + 40 * s],
    [foot.x + wF / 2, foot.y - mat * 1.5],
    [foot.x - wF / 2, foot.y - mat * 1.5],
  ]
    .map(([x, y]) => `${n(x)},${n(y)}`)
    .join(' ');
  out += `<polygon points="${dPts}" fill="${p.cushion}" opacity="0.95"/>`;
  out += `<polygon points="${dPts}" fill="none" stroke="${p.rugLine}" stroke-width="4" opacity="0.35"/>`;
  // 枕
  out += `<rect x="${n(head.x - wH * 0.44)}" y="${n(head.y - mat - 54 * s)}" width="${n(wH * 0.38)}" height="${n(64 * s)}" rx="${n(16 * s)}" fill="#ffffff" opacity="0.92"/>`;
  out += `<rect x="${n(head.x + wH * 0.06)}" y="${n(head.y - mat - 54 * s)}" width="${n(wH * 0.38)}" height="${n(64 * s)}" rx="${n(16 * s)}" fill="#ffffff" opacity="0.92"/>`;
  // 側面（マットレス厚み）
  out += `<polygon points="${n(foot.x - wF / 2)},${n(foot.y - mat * 1.5)} ${n(foot.x + wF / 2)},${n(foot.y - mat * 1.5)} ${n(foot.x + wF / 2)},${n(foot.y - mat * 0.3)} ${n(foot.x - wF / 2)},${n(foot.y - mat * 0.3)}" fill="${p.fabric}"/>`;
  return out;
}

function desk(p: ScenePalette) {
  const a = floorPoint(0.26, 0.6);
  const s = a.scale * 0.36;
  const w = 480 * s;
  const legH = 150 * s;
  const x = a.x - w / 2;
  let out = shadow(a.x, a.y + 4 * s, w * 0.5, 16 * s, 0.13);
  out += `<rect x="${n(x + 10 * s)}" y="${n(a.y - legH)}" width="${n(14 * s)}" height="${n(legH)}" fill="${p.woodDark}"/>`;
  out += `<rect x="${n(x + w - 24 * s)}" y="${n(a.y - legH)}" width="${n(14 * s)}" height="${n(legH)}" fill="${p.woodDark}"/>`;
  out += `<rect x="${n(x)}" y="${n(a.y - legH - 18 * s)}" width="${n(w)}" height="${n(18 * s)}" rx="${n(6 * s)}" fill="${p.wood}"/>`;
  // ノートPCとスタンドライト
  out += `<path d="M${n(a.x - 60 * s)},${n(a.y - legH - 18 * s)} l${n(20 * s)},${n(-80 * s)} l${n(80 * s)},0 l${n(20 * s)},${n(80 * s)} Z" fill="#2f3840"/>`;
  out += `<rect x="${n(x + w - 70 * s)}" y="${n(a.y - legH - 110 * s)}" width="${n(10 * s)}" height="${n(92 * s)}" fill="${p.metal}"/>`;
  out += `<path d="M${n(x + w - 105 * s)},${n(a.y - legH - 110 * s)} l${n(80 * s)},0 l${n(-20 * s)},${n(-34 * s)} l${n(-40 * s)},0 Z" fill="${p.metal}"/>`;
  // デスクチェア
  const c = floorPoint(0.42, 0.8);
  const cs = c.scale * 0.3;
  out += shadow(c.x, c.y + 2 * cs, 90 * cs, 16 * cs, 0.12);
  out += `<rect x="${n(c.x - 16 * cs)}" y="${n(c.y - 120 * cs)}" width="${n(32 * cs)}" height="${n(110 * cs)}" fill="${p.metal}"/>`;
  out += `<path d="M${n(c.x - 90 * cs)},${n(c.y)} L${n(c.x + 90 * cs)},${n(c.y)} L${n(c.x + 60 * cs)},${n(c.y - 22 * cs)} L${n(c.x - 60 * cs)},${n(c.y - 22 * cs)} Z" fill="${p.metal}" opacity="0.8"/>`;
  out += `<rect x="${n(c.x - 105 * cs)}" y="${n(c.y - 150 * cs)}" width="${n(210 * cs)}" height="${n(46 * cs)}" rx="${n(12 * cs)}" fill="${p.fabric}"/>`;
  out += `<rect x="${n(c.x - 95 * cs)}" y="${n(c.y - 300 * cs)}" width="${n(190 * cs)}" height="${n(150 * cs)}" rx="${n(16 * cs)}" fill="${p.fabricDark}"/>`;
  return out;
}

function smallItems(p: ScenePalette) {
  const a = floorPoint(0.47, 0.78);
  const s = a.scale * 0.34;
  const yTop = a.y - 96 * s - 22 * s;
  let out = '';
  out += `<rect x="${n(a.x - 120 * s)}" y="${n(yTop - 26 * s)}" width="${n(86 * s)}" height="${n(26 * s)}" rx="${n(4 * s)}" fill="${p.art1}"/>`;
  out += `<rect x="${n(a.x - 112 * s)}" y="${n(yTop - 44 * s)}" width="${n(70 * s)}" height="${n(18 * s)}" rx="${n(4 * s)}" fill="${p.art2}"/>`;
  out += `<path d="M${n(a.x + 70 * s)},${n(yTop)} l${n(10 * s)},${n(-46 * s)} l${n(26 * s)},0 l${n(10 * s)},${n(46 * s)} Z" fill="${p.metal}" opacity="0.9"/>`;
  out += `<circle cx="${n(a.x + 116 * s)}" cy="${n(yTop - 54 * s)}" r="${n(16 * s)}" fill="#5d8a67"/>`;
  return out;
}

function kidsToy(p: ScenePalette) {
  const a = floorPoint(0.72, 0.84);
  const s = a.scale * 0.3;
  let out = shadow(a.x, a.y + 2 * s, 90 * s, 14 * s, 0.12);
  out += `<rect x="${n(a.x - 80 * s)}" y="${n(a.y - 70 * s)}" width="${n(70 * s)}" height="${n(70 * s)}" rx="${n(8 * s)}" fill="${p.art1}"/>`;
  out += `<rect x="${n(a.x - 4 * s)}" y="${n(a.y - 56 * s)}" width="${n(56 * s)}" height="${n(56 * s)}" rx="${n(8 * s)}" fill="${p.art2}"/>`;
  out += `<circle cx="${n(a.x + 74 * s)}" cy="${n(a.y - 32 * s)}" r="${n(32 * s)}" fill="${p.cushion}"/>`;
  return out;
}

/** 壁面アート（奥の壁） */
function wallArt(p: ScenePalette) {
  let out = '';
  out += `<rect x="330" y="230" width="150" height="190" rx="4" fill="#ffffff" stroke="${p.woodDark}" stroke-width="7"/>`;
  out += `<rect x="345" y="245" width="120" height="160" fill="${p.art1}" opacity="0.9"/>`;
  out += `<path d="M345,405 L392,318 L428,365 L465,330 L465,405 Z" fill="${p.art2}" opacity="0.85"/>`;
  out += `<circle cx="432" cy="282" r="17" fill="#ffffff" opacity="0.75"/>`;
  return out;
}

/** カーテン（窓の左右＋レースカーテン） */
function curtains(p: ScenePalette) {
  const top = WIN.y0 - 24;
  const bottom = WIN.y1 + 26;
  const panel = (x: number, w: number, dir: number) => {
    const folds = 4;
    let d = `M${n(x)},${n(top)} L${n(x + w)},${n(top)} L${n(x + w + dir * 6)},${n(bottom - 12)} `;
    for (let i = folds; i >= 0; i--) {
      const px = x + (w + dir * 6) * (i / folds);
      d += `Q${n(px + w / (folds * 2))},${n(bottom + 14)} ${n(px)},${n(bottom - 4)} `;
    }
    d += 'Z';
    let s = `<path d="${d}" fill="${p.curtain}"/>`;
    for (let i = 1; i < folds; i++) {
      const px = x + (w * i) / folds;
      s += `<line x1="${n(px)}" y1="${n(top + 6)}" x2="${n(px + dir * 3)}" y2="${n(bottom - 10)}" stroke="#000000" stroke-width="2" opacity="0.08"/>`;
    }
    return s;
  };
  let out = `<rect x="${WIN.x0 - 70}" y="${top - 12}" width="${WIN.x1 - WIN.x0 + 140}" height="14" rx="6" fill="${p.woodDark}" opacity="0.85"/>`;
  // レース
  out += `<rect x="${WIN.x0 + 4}" y="${top}" width="${WIN.x1 - WIN.x0 - 8}" height="${bottom - top - 8}" fill="${p.curtainSheer}" opacity="0.5"/>`;
  out += panel(WIN.x0 - 62, 78, -1);
  out += panel(WIN.x1 - 16, 78, 1);
  return out;
}

/** 照明 */
function lightingSvg(type: LightingType, p: ScenePalette) {
  if (type === 'none') return '';
  if (type === 'downlight') {
    let out = '';
    for (const x of [430, 600, 770]) {
      out += `<ellipse cx="${x}" cy="118" rx="26" ry="9" fill="#ffffff" opacity="0.95"/>`;
      out += `<ellipse cx="${x}" cy="118" rx="17" ry="6" fill="${p.lightTone}" opacity="0.9"/>`;
      out += `<path d="M${x - 24},124 L${x + 24},124 L${x + 120},340 L${x - 120},340 Z" fill="${p.lightTone}" opacity="0.10"/>`;
    }
    return out;
  }
  if (type === 'pendant') {
    let out = '';
    for (const x of [500, 600, 700]) {
      out += `<line x1="${x}" y1="60" x2="${x}" y2="188" stroke="${p.metal}" stroke-width="3"/>`;
      out += `<path d="M${x - 44},248 L${x + 44},248 L${x + 22},188 L${x - 22},188 Z" fill="${p.metal}"/>`;
      out += `<ellipse cx="${x}" cy="248" rx="44" ry="10" fill="${p.lightTone}" opacity="0.9"/>`;
    }
    return out;
  }
  // ceiling（シーリングライト）
  let out = `<line x1="600" y1="40" x2="600" y2="120" stroke="${p.metal}" stroke-width="4"/>`;
  out += `<ellipse cx="600" cy="140" rx="112" ry="30" fill="#ffffff" opacity="0.96"/>`;
  out += `<ellipse cx="600" cy="132" rx="112" ry="28" fill="${p.lightTone}" opacity="0.55"/>`;
  out += `<ellipse cx="600" cy="150" rx="150" ry="40" fill="${p.lightTone}" opacity="0.13" filter="url(#soft)"/>`;
  return out;
}

// ------------------------------------------------------------
// 床の表現
// ------------------------------------------------------------
const TATAMI = { fill: '#c2bb8b', line: '#5f5a3c' };

function floorSvg(p: ScenePalette, tatami: boolean) {
  const fill = tatami ? TATAMI.fill : p.floor;
  const lineCol = tatami ? TATAMI.line : p.floorLine;
  const fl = `<polygon points="0,${H} ${BACK.x0},${BACK.y1} ${BACK.x1},${BACK.y1} ${W},${H}" fill="${fill}"/>`;
  let lines = '';
  if (tatami) {
    for (const u of [0.25, 0.5, 0.75]) {
      const a = floorPoint(u, 0);
      const b = floorPoint(u, 1);
      lines += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="${lineCol}" stroke-width="7" opacity="0.85"/>`;
    }
    for (const d of [0.33, 0.66]) {
      const a = floorPoint(0, d);
      const b = floorPoint(1, d);
      lines += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="${lineCol}" stroke-width="7" opacity="0.85"/>`;
    }
  } else {
    // フローリング：消失点へ収束する目地
    for (let i = -6; i <= 18; i++) {
      const x = i * 100;
      lines += `<line x1="${n(x)}" y1="${H}" x2="${VP.x}" y2="${VP.y}" stroke="${lineCol}" stroke-width="2.4" opacity="0.55"/>`;
    }
    for (const d of [0.14, 0.32, 0.55, 0.82]) {
      const a = floorPoint(0, d);
      const b = floorPoint(1, d);
      lines += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="${lineCol}" stroke-width="1.8" opacity="0.4"/>`;
    }
  }
  return `${fl}<g clip-path="url(#floorClip)">${lines}</g>`;
}

// ------------------------------------------------------------
// シーン全体
// ------------------------------------------------------------
export function renderRoomSvg(opts: SceneOptions): string {
  const p = opts.palette;
  const furnitureOnly = opts.mode === 'furniture';
  // 家具レイヤーのみのときは、壁・窓に固定されるパーツ（カーテン／アート）は描かない
  const has = (f: SceneFeature) =>
    !opts.empty &&
    opts.features.includes(f) &&
    !(furnitureOnly && (f === 'curtain' || f === 'art'));
  const backWallFill = p.accentWall ?? p.wallBack;

  const defs = `
  <defs>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12"/>
    </filter>
    <clipPath id="floorClip">
      <polygon points="0,${H} ${BACK.x0},${BACK.y1} ${BACK.x1},${BACK.y1} ${W},${H}"/>
    </clipPath>
    <linearGradient id="glass" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#eaf3f7"/>
      <stop offset="55%" stop-color="#cfe4ee"/>
      <stop offset="100%" stop-color="#dbe9e4"/>
    </linearGradient>
    <linearGradient id="warm" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="${p.lightTone}" stop-opacity="${0.22 * p.lightStrength}"/>
      <stop offset="60%" stop-color="${p.lightTone}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.45" r="0.78">
      <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0d1a14" stop-opacity="0.22"/>
    </radialGradient>
    <linearGradient id="winGlow" x1="0.5" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>`;

  // --- 構造（全スタイル共通） ---
  let s = '';
  if (!furnitureOnly) {
  s += `<rect width="${W}" height="${H}" fill="${p.wallBack}"/>`;
  s += `<polygon points="0,0 ${W},0 ${BACK.x1},${BACK.y0} ${BACK.x0},${BACK.y0}" fill="${p.ceiling}"/>`;
  s += `<polygon points="0,0 ${BACK.x0},${BACK.y0} ${BACK.x0},${BACK.y1} 0,${H}" fill="${p.wallLeft}"/>`;
  s += `<polygon points="${W},0 ${BACK.x1},${BACK.y0} ${BACK.x1},${BACK.y1} ${W},${H}" fill="${p.wallRight}"/>`;
  s += `<rect x="${BACK.x0}" y="${BACK.y0}" width="${BACK.x1 - BACK.x0}" height="${BACK.y1 - BACK.y0}" fill="${backWallFill}"/>`;
  s += floorSvg(p, !!opts.tatami);

  // 幅木（構造要素なので常に描画）
  s += `<polygon points="0,${H} ${BACK.x0},${BACK.y1} ${BACK.x0},${BACK.y1 - 16} 0,${H - 30}" fill="${p.baseboard}"/>`;
  s += `<polygon points="${W},${H} ${BACK.x1},${BACK.y1} ${BACK.x1},${BACK.y1 - 16} ${W},${H - 30}" fill="${p.baseboard}"/>`;
  s += `<rect x="${BACK.x0}" y="${BACK.y1 - 16}" width="${BACK.x1 - BACK.x0}" height="16" fill="${p.baseboard}"/>`;

  // 梁（天井と壁の見切り）
  s += `<polygon points="0,0 ${BACK.x0},${BACK.y0} ${BACK.x0},${BACK.y0 + 12} 0,14" fill="#000000" opacity="0.05"/>`;
  s += `<polygon points="${W},0 ${BACK.x1},${BACK.y0} ${BACK.x1},${BACK.y0 + 12} ${W},14" fill="#000000" opacity="0.05"/>`;

  // 左壁のドア（構造要素）
  const d0 = floorPoint(0, DOOR.d0);
  const d1 = floorPoint(0, DOOR.d1);
  const doorTopA = BACK.y0 + (d0.y - BACK.y0) * 0.12;
  const doorTopB = BACK.y0 + (d1.y - BACK.y0) * 0.12;
  s += `<polygon points="${n(d0.x)},${n(d0.y)} ${n(d1.x)},${n(d1.y)} ${n(d1.x)},${n(doorTopB)} ${n(d0.x)},${n(doorTopA)}" fill="${p.wood}" opacity="0.92"/>`;
  s += `<polygon points="${n(d0.x)},${n(d0.y)} ${n(d1.x)},${n(d1.y)} ${n(d1.x)},${n(doorTopB)} ${n(d0.x)},${n(doorTopA)}" fill="none" stroke="${p.woodDark}" stroke-width="5"/>`;
  s += `<circle cx="${n(d0.x + (d1.x - d0.x) * 0.12)}" cy="${n(d0.y - (d0.y - doorTopA) * 0.42)}" r="8" fill="${p.metal}"/>`;

  // 窓（構造要素：位置・サイズは固定）
  s += `<rect x="${WIN.x0 - 10}" y="${WIN.y0 - 10}" width="${WIN.x1 - WIN.x0 + 20}" height="${WIN.y1 - WIN.y0 + 20}" rx="3" fill="#f7f8f6"/>`;
  s += `<rect x="${WIN.x0}" y="${WIN.y0}" width="${WIN.x1 - WIN.x0}" height="${WIN.y1 - WIN.y0}" fill="url(#glass)"/>`;
  s += `<path d="M${WIN.x0},${WIN.y1} L${WIN.x0 + 90},${WIN.y0 + 96} L${WIN.x1},${WIN.y0 + 96} L${WIN.x1},${WIN.y1} Z" fill="#b9cfc4" opacity="0.6"/>`;
  s += `<circle cx="${WIN.x0 + 236}" cy="${WIN.y0 + 60}" r="30" fill="#ffffff" opacity="0.5"/>`;
  s += `<rect x="${(WIN.x0 + WIN.x1) / 2 - 4}" y="${WIN.y0}" width="8" height="${WIN.y1 - WIN.y0}" fill="#f7f8f6"/>`;
  s += `<rect x="${WIN.x0}" y="${WIN.y0}" width="${WIN.x1 - WIN.x0}" height="${WIN.y1 - WIN.y0}" fill="none" stroke="#e7eae6" stroke-width="6"/>`;
  // 窓からの採光
  s += `<polygon points="${WIN.x0},${WIN.y1} ${WIN.x1},${WIN.y1} ${n(floorPoint(1, 0.62).x)},${n(floorPoint(1, 0.62).y)} ${n(floorPoint(0.42, 0.62).x)},${n(floorPoint(0.42, 0.62).y)}" fill="#ffffff" opacity="0.13"/>`;
  }

  // --- 家具（奥→手前の順に描画） ---
  if (has('curtain')) s += curtains(p);
  if (has('art')) s += wallArt(p);
  if (has('storage')) s += storage(p);
  if (has('tv')) s += tvBoard(p);
  if (has('rug')) s += rug(p);
  if (has('bed')) s += bed(p);
  // LDKのようにソファとダイニングが同居する場合は、ダイニングを左奥へ寄せて重なりを避ける
  if (has('dining')) {
    if (has('sofa')) s += diningSet(p, 0.63, 0.18, 0.72);
    else s += diningSet(p);
  }
  if (has('desk')) s += desk(p);
  if (has('sofa')) s += sofa(p);
  if (has('lowTable')) s += lowTable(p, 0.5, 0.72, 1.35);
  if (has('table')) s += lowTable(p);
  if (has('smallItems')) s += smallItems(p);
  if (has('plant')) s += plant(0.95, 0.52, p, 1.05);
  if (has('plant')) s += plant(0.06, 0.62, p, 0.75);
  if (has('kidsToy')) s += kidsToy(p);

  // --- 照明と光 ---
  if (!furnitureOnly) {
    s += lightingSvg(opts.empty ? 'ceiling' : opts.lighting, p);
    s += `<rect width="${W}" height="${H}" fill="url(#warm)"/>`;
    s += `<rect width="${W}" height="${H}" fill="url(#vig)"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">${defs}${s}</svg>`;
}

/** SVG文字列を <img src> に使える data URL へ変換 */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** アイテムサムネイル用の小さなSVG */
export function itemThumb(kind: string, p: ScenePalette): string {
  const bg = `<rect width="120" height="90" rx="8" fill="${p.wallBack}"/>`;
  const shapes: Record<string, string> = {
    sofa: `<rect x="18" y="38" width="84" height="22" rx="7" fill="${p.fabric}"/><rect x="24" y="24" width="72" height="20" rx="7" fill="${p.fabricDark}"/><rect x="14" y="32" width="14" height="30" rx="6" fill="${p.fabricDark}"/><rect x="92" y="32" width="14" height="30" rx="6" fill="${p.fabricDark}"/>`,
    table: `<rect x="22" y="40" width="76" height="9" rx="4" fill="${p.wood}"/><rect x="30" y="49" width="7" height="17" fill="${p.woodDark}"/><rect x="83" y="49" width="7" height="17" fill="${p.woodDark}"/>`,
    rug: `<ellipse cx="60" cy="52" rx="42" ry="17" fill="${p.rug}"/><ellipse cx="60" cy="52" rx="42" ry="17" fill="none" stroke="${p.rugLine}" stroke-width="3"/>`,
    plant: `<path d="M50,58 L70,58 L66,76 L54,76 Z" fill="${p.wood}"/><path d="M60,58 q-22,-14 -16,-34 q18,6 16,34" fill="#4c8059"/><path d="M60,58 q22,-12 18,-32 q-20,6 -18,32" fill="#3d6e4d"/>`,
    curtain: `<rect x="26" y="18" width="24" height="58" rx="6" fill="${p.curtain}"/><rect x="70" y="18" width="24" height="58" rx="6" fill="${p.curtain}"/><rect x="50" y="18" width="20" height="58" fill="${p.curtainSheer}" opacity="0.7"/>`,
    light: `<line x1="60" y1="14" x2="60" y2="32" stroke="${p.metal}" stroke-width="3"/><path d="M34,56 L86,56 L74,32 L46,32 Z" fill="${p.metal}"/><ellipse cx="60" cy="58" rx="26" ry="6" fill="${p.lightTone}"/>`,
    tv: `<rect x="22" y="22" width="76" height="42" rx="4" fill="#2a3138"/><rect x="27" y="27" width="66" height="32" fill="#3d4a55"/><rect x="52" y="64" width="16" height="6" fill="#2a3138"/>`,
    dining: `<rect x="20" y="38" width="80" height="8" rx="3" fill="${p.wood}"/><rect x="28" y="46" width="7" height="22" fill="${p.woodDark}"/><rect x="85" y="46" width="7" height="22" fill="${p.woodDark}"/><rect x="34" y="24" width="18" height="16" rx="4" fill="${p.fabric}"/><rect x="68" y="24" width="18" height="16" rx="4" fill="${p.fabric}"/>`,
    bed: `<rect x="18" y="34" width="84" height="30" rx="6" fill="${p.fabric}"/><rect x="18" y="22" width="84" height="14" rx="5" fill="${p.fabricDark}"/><rect x="26" y="36" width="28" height="12" rx="4" fill="#ffffff"/>`,
    storage: `<rect x="34" y="18" width="52" height="58" rx="4" fill="${p.wood}"/><line x1="34" y1="37" x2="86" y2="37" stroke="${p.woodDark}" stroke-width="3"/><line x1="34" y1="56" x2="86" y2="56" stroke="${p.woodDark}" stroke-width="3"/>`,
    art: `<rect x="34" y="18" width="52" height="58" rx="3" fill="#ffffff" stroke="${p.woodDark}" stroke-width="4"/><rect x="41" y="25" width="38" height="44" fill="${p.art1}"/><path d="M41,69 L56,44 L67,57 L79,45 L79,69 Z" fill="${p.art2}"/>`,
    cushion: `<rect x="24" y="30" width="34" height="34" rx="7" fill="${p.cushion}"/><rect x="62" y="34" width="30" height="30" rx="7" fill="${p.fabric}"/>`,
    desk: `<rect x="20" y="36" width="80" height="8" rx="3" fill="${p.wood}"/><rect x="26" y="44" width="7" height="24" fill="${p.woodDark}"/><rect x="87" y="44" width="7" height="24" fill="${p.woodDark}"/><path d="M46,36 l6,-18 h20 l6,18 Z" fill="#2f3840"/>`,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" width="120" height="90">${bg}${shapes[kind] ?? shapes.sofa}</svg>`;
  return svgToDataUrl(svg);
}
