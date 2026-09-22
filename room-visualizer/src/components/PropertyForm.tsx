import { useState } from 'react';
import type { PropertyInfo } from '../types';
import { PROPERTY_PURPOSES } from '../mock/options';
import { IconBuilding, IconChevron } from '../icons';

interface Props {
  value: PropertyInfo;
  onChange: (v: PropertyInfo) => void;
}

/**
 * 物件情報の入力（すべて任意）
 * 将来的に社内の物件データベースと連携し、物件名の入力で自動補完する想定。
 */
export function PropertyForm({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const set = (k: keyof PropertyInfo) => (v: string) => onChange({ ...value, [k]: v });
  const filled = [value.name, value.address, value.roomNumber, value.staff, value.purpose, value.memo].filter(Boolean).length;

  return (
    <section className="card">
      <button type="button" className="accordion-btn" onClick={() => setOpen((v) => !v)}>
        <IconBuilding size={16} />
        物件情報
        <span className="count">{filled > 0 ? `${value.name || '未入力'}` : '任意・すべて省略可'}</span>
        <IconChevron size={16} open={open} />
      </button>
      {open && (
        <div className="card-body" style={{ paddingTop: 0 }}>
          <div className="field">
            <label htmlFor="pf-name">
              物件名<span className="opt">任意</span>
            </label>
            <input
              id="pf-name"
              type="text"
              value={value.name}
              onChange={(e) => set('name')(e.target.value)}
              placeholder="例）グリーンハイツ江坂"
              list="property-suggestions"
            />
            {/* 将来的に社内物件DBから候補を取得して表示する */}
            <datalist id="property-suggestions">
              <option value="グリーンハイツ江坂" />
              <option value="パークサイド千里" />
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="pf-address">
              所在地<span className="opt">任意</span>
            </label>
            <input
              id="pf-address"
              type="text"
              value={value.address}
              onChange={(e) => set('address')(e.target.value)}
              placeholder="例）大阪府吹田市江坂町1-2-3"
            />
          </div>
          <div className="field">
            <label htmlFor="pf-room">
              部屋番号<span className="opt">任意</span>
            </label>
            <input
              id="pf-room"
              type="text"
              value={value.roomNumber}
              onChange={(e) => set('roomNumber')(e.target.value)}
              placeholder="例）302号室"
            />
          </div>
          <div className="field">
            <label htmlFor="pf-staff">
              担当者<span className="opt">任意</span>
            </label>
            <input
              id="pf-staff"
              type="text"
              value={value.staff}
              onChange={(e) => set('staff')(e.target.value)}
              placeholder="例）営業部 佐藤"
            />
          </div>
          <div className="field">
            <label htmlFor="pf-purpose">
              用途<span className="opt">任意</span>
            </label>
            <select id="pf-purpose" value={value.purpose} onChange={(e) => set('purpose')(e.target.value)}>
              <option value="">選択してください</option>
              {PROPERTY_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pf-memo">
              メモ<span className="opt">任意</span>
            </label>
            <textarea
              id="pf-memo"
              value={value.memo}
              onChange={(e) => set('memo')(e.target.value)}
              placeholder="例）南向き・角部屋。空室3ヶ月。"
              style={{ minHeight: 60 }}
            />
          </div>
          <p className="hint">将来的に社内の物件データベースと連携し、物件名から自動入力できるようにする想定です。</p>
        </div>
      )}
    </section>
  );
}
