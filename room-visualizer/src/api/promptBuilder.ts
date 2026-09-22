// ============================================================
// プロンプト生成
// ------------------------------------------------------------
// モック版でも実際にプロンプト文字列を組み立てておく。
// 将来的に画像生成APIへ接続する際は、この文字列をそのまま送信できる。
// ============================================================
import type { GenerationCondition, StyleId, PropertyInfo } from '../types';
import { ROOM_TYPES, CHANGE_ITEMS, REFORM_ITEMS, TARGETS } from '../mock/options';
import { STYLE_MAP } from '../mock/styles';

/**
 * 「部屋の構造は変えない」という本アプリの前提を、必ずプロンプトの先頭に入れる。
 * 不動産広告として使うため、実在しない構造を作り出さないことが最優先。
 */
export const STRUCTURE_LOCK_PROMPT = [
  'Keep the existing room structure exactly as in the source photo:',
  'window position and size, pillars, beams, doors, ceiling height,',
  'floor plan, room shape and camera angle must not change.',
  'Only change furniture, interior items, flooring finish, wall finish and lighting.',
  'The result must look like a realistic photo usable in a real estate listing.',
].join(' ');

export function buildPrompt(
  condition: GenerationCondition,
  styleId: StyleId,
  property?: PropertyInfo,
): string {
  const style = STYLE_MAP[styleId];
  const roomType = ROOM_TYPES.find((r) => r.id === condition.roomType);
  const changes = condition.changeItems
    .map((id) => CHANGE_ITEMS.find((c) => c.id === id)?.keywords)
    .filter(Boolean);
  const reforms = condition.reformItems
    .map((id) => REFORM_ITEMS.find((c) => c.id === id)?.keywords)
    .filter(Boolean);
  const targets = condition.targets
    .map((id) => TARGETS.find((t) => t.id === id)?.keywords)
    .filter(Boolean);

  const lines = [
    STRUCTURE_LOCK_PROMPT,
    `Room type: ${roomType?.keywords ?? 'room'}.`,
    `Interior style: ${style.keywords}.`,
  ];
  if (changes.length) lines.push(`Changes: ${changes.join(', ')}.`);
  if (reforms.length) lines.push(`Renovation look: ${reforms.join(', ')}.`);
  if (targets.length) lines.push(`Target resident: ${targets.join(', ')}.`);
  if (condition.freeText.trim()) lines.push(`Additional request: ${condition.freeText.trim()}`);
  if (property?.purpose) lines.push(`Usage: ${property.purpose}.`);

  return lines.join('\n');
}
