import { useEffect, useState } from 'react';

/* ============================================================
 * 設定・種目マスタ
 * ============================================================ */
const STORAGE_KEY = 'workout-log';
const TARGET_REPS = 12; // 全セットこの回数で重量を上げる
const DEFAULT_SETS = 3;
const START_REPS = 10; // 初回・重量を上げた直後のrep初期値
const WEIGHT_STEP = 5;

// 全種目シーテッドマシンか膝つき姿勢。standing: true の種目は候補に出さない。
// inc: 進行ルールで上げる重量 / start: 初回の初期重量
const MASTER = [
  { name: 'バイク・ローイング', kind: 'time', minutes: 15, variants: ['バイク', 'ローイング'] },
  { name: 'レッグプレス', kind: 'weight', start: 40, inc: 10 },
  { name: 'レッグエクステンション', kind: 'weight', start: 20, inc: 5 },
  { name: 'アブダクション', kind: 'weight', start: 20, inc: 5 },
  { name: 'アダクション', kind: 'weight', start: 20, inc: 5 },
  { name: 'リアデルト', kind: 'weight', start: 10, inc: 5 },
  { name: 'フロントプル', kind: 'weight', start: 20, inc: 5 },
  { name: 'シーテッドロウ', kind: 'weight', start: 20, inc: 5 },
  { name: 'チェストプレス', kind: 'weight', start: 15, inc: 5 },
  { name: 'ショルダープレス', kind: 'weight', start: 10, inc: 5 },
  { name: 'SONIX', kind: 'time', minutes: 10 }
].filter((m) => !m.standing);
const BY_NAME = Object.fromEntries(MASTER.map((m) => [m.name, m]));

// 上半身は肩に優しい順（後部→引く→押す）。重いプレスは後ろに置く。
const PARTS = {
  下半身: ['バイク・ローイング', 'レッグプレス', 'レッグエクステンション', 'アブダクション', 'アダクション', 'SONIX'],
  上半身: ['バイク・ローイング', 'リアデルト', 'フロントプル', 'シーテッドロウ', 'チェストプレス', 'ショルダープレス', 'SONIX'],
  全身: ['バイク・ローイング', 'リアデルト', 'フロントプル', 'シーテッドロウ', 'レッグプレス', 'レッグエクステンション', 'アブダクション', 'アダクション', 'チェストプレス', 'SONIX']
};
const FEELS = ['楽だった', 'ちょうどいい', 'きつかった'];
const WEIGHT_EXERCISES = MASTER.filter((m) => m.kind === 'weight').map((m) => m.name);

/* ============================================================
 * 保存（localStorage のキーは1つ）
 * ============================================================ */
function loadData() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return {
      sessions: Array.isArray(d?.sessions) ? d.sessions : [],
      goals: Array.isArray(d?.goals) ? d.goals : []
    };
  } catch {
    return { sessions: [], goals: [] };
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* 保存できない環境でも画面は動かす */
  }
}

/* ============================================================
 * 日付・集計ロジック
 * ============================================================ */
const pad = (n) => String(n).padStart(2, '0');
const todayStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (s) => s.split('-').map(Number);
const dayNum = (s) => {
  const [y, m, d] = parseDate(s);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
};
// 月曜始まりの週番号（1970-01-01は木曜）
const weekIndex = (s) => Math.floor((dayNum(s) + 3) / 7);
const fmtShort = (s) => {
  const [y, m, d] = parseDate(s);
  return `${m}/${d}(${'日月火水木金土'[new Date(y, m - 1, d).getDay()]})`;
};
const fmtJa = (s) => {
  const [, m, d] = parseDate(s);
  return `${m}月${d}日`;
};
const sum = (a) => a.reduce((x, y) => x + y, 0);
const allHit = (reps) => reps.length > 0 && reps.every((r) => r >= TARGET_REPS);
const sortSessions = (list) => [...list].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

function lastRecord(sessions, name) {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const e = (sessions[i].exercises || []).find((x) => x.name === name);
    if (e) return { ...e, date: sessions[i].date };
  }
  return null;
}

function bestWeight(sessions, name) {
  let best = null;
  for (const s of sessions) {
    for (const e of s.exercises || []) {
      if (e.name === name && typeof e.weight === 'number' && sum(e.reps || []) > 0) {
        best = best === null ? e.weight : Math.max(best, e.weight);
      }
    }
  }
  return best;
}

// 進行ルール：前回全セット12rep達成 → +inc。未達なら据え置き
function recommend(master, last) {
  if (!last || typeof last.weight !== 'number') {
    return { weight: master.start, reps: Array(DEFAULT_SETS).fill(START_REPS), up: false };
  }
  const prevReps = last.reps?.length ? last.reps : Array(DEFAULT_SETS).fill(START_REPS);
  const up = allHit(prevReps);
  return {
    weight: up ? last.weight + master.inc : last.weight,
    reps: up ? prevReps.map(() => START_REPS) : [...prevReps],
    up
  };
}

// 連続週数：1週空きは「保留」、2週空きでリセット
function streakInfo(sessions, today) {
  const weeks = [...new Set(sessions.map((s) => weekIndex(s.date)))].sort((a, b) => b - a);
  if (!weeks.length) return { count: 0, status: 'none' };
  const idle = weekIndex(today) - weeks[0]; // 0:今週済 1:先週済 2:先週空き 3以上:2週以上空き
  if (idle >= 3) return { count: 0, status: 'reset' };
  let count = 1;
  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i - 1] - weeks[i] <= 2) count++;
    else break;
  }
  return { count, status: idle === 2 ? 'hold' : 'active' };
}

// 継続目標：開始日以降に記録がある週の数
function habitProgress(goal, sessions) {
  const from = goal.startDate || '0000-00-00';
  return new Set(sessions.filter((s) => s.date >= from).map((s) => weekIndex(s.date))).size;
}

function goalCurrent(goal, sessions) {
  if (goal.type === 'habit') return habitProgress(goal, sessions);
  if (goal.exercise) return Math.max(bestWeight(sessions, goal.exercise) ?? 0, Number(goal.current) || 0);
  return Number(goal.current) || 0;
}

/* ============================================================
 * ふりかえり生成（記録データの事実のみ）
 * ============================================================ */
function buildReflection(prior, current) {
  const weightEx = current.exercises.filter((e) => typeof e.weight === 'number');

  if (!prior.length) {
    const first = weightEx[0];
    const lines = [{ label: '記録開始', text: `${fmtJa(current.date)}、${current.part}・${current.exercises.length}種目で記録を開始しました。` }];
    if (first) {
      const rest = weightEx.length - 1;
      lines.push({ label: '記録開始', text: `${first.name} ${first.weight}kg × ${first.reps.join('/')}回${rest > 0 ? ` ほか${rest}種目` : ''}。` });
    }
    return { lines, prs: [] };
  }

  const good = [];
  const concerns = [];
  const prs = [];

  for (const e of weightEx) {
    const prev = lastRecord(prior, e.name);
    const best = bestWeight(prior, e.name);
    const isPr = best !== null && e.weight > best && sum(e.reps) > 0;
    if (isPr) prs.push(e.name);
    if (!prev || typeof prev.weight !== 'number') continue;
    const prevSum = sum(prev.reps || []);
    const curSum = sum(e.reps);
    if (e.weight > prev.weight) {
      good.push({ score: 3, text: `${e.name} ${prev.weight}kg → ${e.weight}kg（+${e.weight - prev.weight}kg）${isPr ? '、自己ベスト' : ''}。` });
    } else if (e.weight === prev.weight && curSum > prevSum) {
      good.push({ score: 2, text: `${e.name} ${e.weight}kgで合計${prevSum}回 → ${curSum}回（+${curSum - prevSum}回）。` });
    } else if (e.weight === prev.weight && curSum === prevSum && !allHit(e.reps)) {
      concerns.push({ score: 1, text: `${e.name}は${e.weight}kg・合計${curSum}回で前回と同じです。` });
    } else if (e.weight === prev.weight && curSum < prevSum) {
      concerns.push({ score: 2, text: `${e.name}は${e.weight}kgで合計${prevSum}回 → ${curSum}回でした。` });
    } else if (e.weight < prev.weight) {
      concerns.push({ score: 1, text: `${e.name}は${prev.weight}kg → ${e.weight}kgに下げています。` });
    }
  }

  const all = sortSessions([...prior, current]);
  const streak = streakInfo(all, current.date);
  if (streak.count >= 2) good.push({ score: 1, text: `${streak.count}週連続で記録しています。` });
  good.push({ score: 0, text: `記録は通算${all.length}回目です。` });

  const lastDate = sortSessions(prior).filter((s) => s.date <= current.date).pop()?.date;
  const gap = lastDate ? dayNum(current.date) - dayNum(lastDate) : 0;
  if (gap >= 14) concerns.unshift({ score: 9, text: `前回（${fmtJa(lastDate)}）から${gap}日空きました。` });

  const lines = good
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((g) => ({ label: '良かった点', text: g.text }));
  const concern = concerns.sort((a, b) => b.score - a.score)[0];
  if (concern) lines.push({ label: '気になった点', text: concern.text });

  // 次回：上げる種目を1つだけ
  const menuOrder = PARTS[current.part] || [];
  const ordered = [...weightEx].sort((a, b) => menuOrder.indexOf(a.name) - menuOrder.indexOf(b.name));
  const ready = ordered.find((e) => allHit(e.reps));
  if (ready) {
    const inc = BY_NAME[ready.name]?.inc ?? WEIGHT_STEP;
    lines.push({ label: '次回', text: `${ready.name}を${ready.weight + inc}kgに上げる（今回 全セット${TARGET_REPS}回達成）。` });
  } else if (ordered.length) {
    const closest = ordered.reduce((a, b) => (Math.min(...b.reps) > Math.min(...a.reps) ? b : a));
    const inc = BY_NAME[closest.name]?.inc ?? WEIGHT_STEP;
    lines.push({ label: '次回', text: `${closest.name}（${closest.weight}kg）は全セット${TARGET_REPS}回で+${inc}kg。今回 ${closest.reps.join('/')}回。` });
  }

  return { lines, prs };
}

/* ============================================================
 * 小さな部品
 * ============================================================ */
function Stepper({ value, onChange, step = 1, min = 0, unit, vertical }) {
  const num = Number(value) || 0;
  const set = (v) => onChange(Math.max(min, Math.round(v * 10) / 10));
  const input = (
    <input
      className="num"
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value === '' ? '' : Math.max(min, Number(e.target.value)))}
      onFocus={(e) => e.target.select()}
    />
  );
  if (vertical) {
    return (
      <div className="vstep">
        <button type="button" onClick={() => set(num + step)} aria-label="増やす">＋</button>
        {input}
        <button type="button" onClick={() => set(num - step)} aria-label="減らす">−</button>
      </div>
    );
  }
  return (
    <div className="hstep">
      <button type="button" onClick={() => set(num - step)} aria-label="減らす">−</button>
      {input}
      {unit && <span className="unit">{unit}</span>}
      <button type="button" onClick={() => set(num + step)} aria-label="増やす">＋</button>
    </div>
  );
}

function Bar({ value, target }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="bar" role="progressbar" aria-valuenow={value} aria-valuemax={target}>
      <div className="bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ============================================================
 * 画面1: ホーム
 * ============================================================ */
function Home({ data, onStart }) {
  const sessions = sortSessions(data.sessions);
  const streak = streakInfo(sessions, todayStr());
  const recent = sessions.slice(-3).reverse();
  const habits = data.goals.filter((g) => g.type === 'habit');

  const statusText = {
    none: 'まだ記録がありません',
    active: '継続中',
    hold: '先週は記録なし（保留）。今週記録すると連続が続きます',
    reset: '2週以上空いたため、連続はリセットされました'
  }[streak.status];

  return (
    <div className="screen">
      <h1 className="today">今日は？</h1>
      <div className="parts">
        {Object.keys(PARTS).map((p) => (
          <button key={p} className="part-btn" onClick={() => onStart(p)}>
            {p}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="streak">
          <span className="streak-num">{streak.count}</span>
          <span className="streak-unit">週連続</span>
          {streak.status === 'hold' && <span className="tag hold">保留</span>}
        </div>
        <p className="muted small">{statusText}</p>
        <h2>直近の実施日</h2>
        {recent.length ? (
          <ul className="recent">
            {recent.map((s, i) => (
              <li key={i}>
                <span>{fmtShort(s.date)}</span>
                <span className="muted">{s.part}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">記録するとここに表示されます</p>
        )}
      </section>

      <section className="card">
        <h2>継続目標</h2>
        {habits.length ? (
          habits.map((g) => {
            const cur = habitProgress(g, data.sessions);
            return (
              <div key={g.id} className="goal-row">
                <div className="goal-head">
                  <span>{g.label}</span>
                  <span className="goal-val">
                    {cur}/{g.target}回
                  </span>
                </div>
                <Bar value={cur} target={g.target} />
              </div>
            );
          })
        ) : (
          <p className="muted small">「目標」タブで継続目標を登録できます</p>
        )}
      </section>
    </div>
  );
}

/* ============================================================
 * 画面2: 今日のメニュー
 * ============================================================ */
function buildDraft(part, sessions) {
  return PARTS[part].map((name) => {
    const m = BY_NAME[name];
    const prev = lastRecord(sessions, name);
    if (m.kind === 'time') {
      return {
        name,
        kind: 'time',
        enabled: true,
        minutes: prev?.minutes ?? m.minutes,
        variant: prev?.variant ?? m.variants?.[0],
        prev
      };
    }
    const rec = recommend(m, prev);
    return { name, kind: 'weight', enabled: true, weight: rec.weight, reps: rec.reps, up: rec.up, prev, best: bestWeight(sessions, name) };
  });
}

function Menu({ part, data, onSave, onCancel }) {
  const sessions = sortSessions(data.sessions);
  const [date, setDate] = useState(todayStr());
  const [items, setItems] = useState(() => buildDraft(part, sessions));
  const [feel, setFeel] = useState(null);

  const update = (i, patch) => setItems((list) => list.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const setRep = (i, k, v) => setItems((list) => list.map((it, j) => (j === i ? { ...it, reps: it.reps.map((r, n) => (n === k ? v : r)) } : it)));
  const enabledCount = items.filter((it) => it.enabled).length;

  const save = () => {
    const exercises = items
      .filter((it) => it.enabled)
      .map((it) =>
        it.kind === 'time'
          ? { name: it.name, minutes: Number(it.minutes) || 0, reps: [], ...(it.variant ? { variant: it.variant } : {}) }
          : { name: it.name, weight: Number(it.weight) || 0, reps: it.reps.map((r) => Number(r) || 0) }
      );
    onSave({ date: date || todayStr(), part, exercises, feel });
  };

  return (
    <div className="screen with-footer">
      <div className="menu-head">
        <button className="link" onClick={onCancel}>
          ← 戻る
        </button>
        <h1>{part}</h1>
        <input className="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {items.map((it, i) => (
        <section key={it.name} className={`card ex ${it.enabled ? '' : 'off'}`}>
          <div className="ex-head">
            <label className="ex-name">
              <input type="checkbox" checked={it.enabled} onChange={(e) => update(i, { enabled: e.target.checked })} />
              {it.name}
            </label>
            {!it.enabled && <span className="muted small">スキップ</span>}
          </div>

          {it.enabled && it.kind === 'time' && (
            <div className="ex-body">
              {BY_NAME[it.name].variants && (
                <div className="seg">
                  {BY_NAME[it.name].variants.map((v) => (
                    <button key={v} className={it.variant === v ? 'on' : ''} onClick={() => update(i, { variant: v })}>
                      {v}
                    </button>
                  ))}
                </div>
              )}
              <Stepper value={it.minutes} onChange={(v) => update(i, { minutes: v })} step={5} unit="分" />
            </div>
          )}

          {it.enabled && it.kind === 'weight' && (
            <div className="ex-body">
              <p className="prev small">
                {it.prev ? (
                  <>
                    前回 {it.prev.weight}kg × {(it.prev.reps || []).join('/')}
                    <span className="muted">（{fmtShort(it.prev.date)}）</span>
                    {it.up && <span className="up"> → 全セット{TARGET_REPS}回達成で+{BY_NAME[it.name].inc}kg</span>}
                  </>
                ) : (
                  <span className="muted">前回の記録なし</span>
                )}
              </p>
              <div className="weight-row">
                <Stepper value={it.weight} onChange={(v) => update(i, { weight: v })} step={WEIGHT_STEP} unit="kg" />
                {it.best !== null && Number(it.weight) > it.best && <span className="pr">自己ベスト</span>}
              </div>
              <div className="sets">
                {it.reps.map((r, k) => (
                  <div key={k} className="set">
                    <span className="muted tiny">{k + 1}セット</span>
                    <Stepper vertical value={r} onChange={(v) => setRep(i, k, v)} />
                  </div>
                ))}
              </div>
              <div className="set-ctrl">
                <button className="link small" disabled={it.reps.length <= 1} onClick={() => update(i, { reps: it.reps.slice(0, -1) })}>
                  − セット
                </button>
                <button className="link small" onClick={() => update(i, { reps: [...it.reps, it.reps[it.reps.length - 1] ?? START_REPS] })}>
                  ＋ セット
                </button>
              </div>
            </div>
          )}
        </section>
      ))}

      <footer className="footer">
        <div className="feels">
          {FEELS.map((f) => (
            <button key={f} className={feel === f ? 'on' : ''} onClick={() => setFeel(f)}>
              {f}
            </button>
          ))}
        </div>
        <button className="primary" disabled={!feel || !enabledCount} onClick={save}>
          {!enabledCount ? '種目を選んでください' : feel ? '記録する' : '体感を選んでください'}
        </button>
      </footer>
    </div>
  );
}

/* ============================================================
 * 画面3: ふりかえり
 * ============================================================ */
function Review({ session, reflection, onHome, onUndo }) {
  return (
    <div className="screen">
      <h1>ふりかえり</h1>
      <p className="muted">
        {fmtShort(session.date)}・{session.part}・体感「{session.feel}」
      </p>
      <section className="card">
        {reflection.lines.map((l, i) => (
          <div key={i} className="ref-line">
            <span className={`ref-label ${l.label === '気になった点' ? 'warn' : l.label === '次回' ? 'next' : ''}`}>{l.label}</span>
            <p>{l.text}</p>
          </div>
        ))}
      </section>
      <section className="card">
        <h2>今回の記録</h2>
        <ul className="log">
          {session.exercises.map((e) => (
            <li key={e.name}>
              <span>
                {e.name}
                {reflection.prs.includes(e.name) && <span className="pr">自己ベスト</span>}
              </span>
              <span className="muted">
                {typeof e.weight === 'number' ? `${e.weight}kg × ${e.reps.join('/')}` : `${e.variant ? e.variant + ' ' : ''}${e.minutes}分`}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <button className="primary" onClick={onHome}>
        ホームへ
      </button>
      <button className="link small center" onClick={onUndo}>
        この記録を取り消す
      </button>
    </div>
  );
}

/* ============================================================
 * 画面4: 目標
 * ============================================================ */
const PRESETS = [
  { type: 'result', label: '握力', target: 100, current: 0, exercise: '' },
  { type: 'result', label: 'チェストプレス', target: 50, current: 0, exercise: 'チェストプレス' },
  { type: 'habit', label: '週1回を12週', target: 12 }
];

function Goals({ data, setGoals }) {
  const emptyForm = { type: 'result', label: '', target: '', current: '', exercise: '' };
  const [form, setForm] = useState(emptyForm);
  const [exportText, setExportText] = useState('');
  const [copied, setCopied] = useState('');

  const add = () => {
    const target = Number(form.target);
    if (!form.label.trim() || !(target > 0)) return;
    const g = { id: Date.now().toString(36), type: form.type, label: form.label.trim(), target };
    if (form.type === 'result') {
      g.exercise = form.exercise || '';
      g.current = Number(form.current) || 0;
    } else {
      g.startDate = todayStr();
      g.current = 0;
    }
    setGoals([...data.goals, g]);
    setForm(emptyForm);
  };

  const patch = (id, p) => setGoals(data.goals.map((g) => (g.id === id ? { ...g, ...p } : g)));
  const remove = (id) => {
    if (confirm('この目標を削除しますか？')) setGoals(data.goals.filter((g) => g.id !== id));
  };

  const doExport = async () => {
    const text = JSON.stringify({ sessions: data.sessions, goals: data.goals }, null, 2);
    setExportText(text);
    try {
      await navigator.clipboard.writeText(text);
      setCopied('コピーしました');
    } catch {
      setCopied('下の欄を長押ししてコピーしてください');
    }
  };

  const results = data.goals.filter((g) => g.type === 'result');
  const habits = data.goals.filter((g) => g.type === 'habit');

  return (
    <div className="screen">
      <h1>目標</h1>

      <section className="card">
        <h2>結果目標</h2>
        {!results.length && <p className="muted small">まだありません</p>}
        {results.map((g) => {
          const cur = goalCurrent(g, data.sessions);
          return (
            <div key={g.id} className="goal-row">
              <div className="goal-head">
                <span>{g.label}</span>
                <span className="goal-val">
                  {cur}/{g.target}kg
                </span>
              </div>
              <Bar value={cur} target={g.target} />
              <div className="goal-ctrl">
                {g.exercise ? (
                  <span className="muted tiny">{g.exercise}の記録から自動反映</span>
                ) : (
                  <Stepper value={g.current} onChange={(v) => patch(g.id, { current: v })} unit="kg" />
                )}
                <button className="link small" onClick={() => remove(g.id)}>
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2>継続目標</h2>
        {!habits.length && <p className="muted small">まだありません</p>}
        {habits.map((g) => {
          const cur = habitProgress(g, data.sessions);
          return (
            <div key={g.id} className="goal-row">
              <div className="goal-head">
                <span>{g.label}</span>
                <span className="goal-val">
                  {cur}/{g.target}回
                </span>
              </div>
              <Bar value={cur} target={g.target} />
              <div className="goal-ctrl">
                <span className="muted tiny">{fmtJa(g.startDate)}から記録のある週を数えています</span>
                <button className="link small" onClick={() => remove(g.id)}>
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2>目標を追加</h2>
        <div className="presets">
          {PRESETS.map((p) => (
            <button key={p.label} className="chip" onClick={() => setForm({ ...emptyForm, ...p })}>
              {p.type === 'habit' ? p.label : `${p.label}${p.target}kg`}
            </button>
          ))}
        </div>
        <div className="seg">
          <button className={form.type === 'result' ? 'on' : ''} onClick={() => setForm({ ...form, type: 'result' })}>
            結果目標
          </button>
          <button className={form.type === 'habit' ? 'on' : ''} onClick={() => setForm({ ...form, type: 'habit' })}>
            継続目標
          </button>
        </div>
        <label className="field">
          名前
          <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder={form.type === 'result' ? '例：握力' : '例：週1回を12週'} />
        </label>
        {form.type === 'result' && (
          <label className="field">
            種目の記録と連動
            <select value={form.exercise} onChange={(e) => setForm({ ...form, exercise: e.target.value })}>
              <option value="">しない（手入力）</option>
              {WEIGHT_EXERCISES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          {form.type === 'result' ? '目標値（kg）' : '目標回数（週）'}
          <input type="number" inputMode="decimal" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
        </label>
        {form.type === 'result' && !form.exercise && (
          <label className="field">
            現在値（kg）
            <input type="number" inputMode="decimal" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
          </label>
        )}
        <button className="primary" disabled={!form.label.trim() || !(Number(form.target) > 0)} onClick={add}>
          追加する
        </button>
      </section>

      <section className="card">
        <h2>データ</h2>
        <p className="muted small">
          記録 {data.sessions.length}件・目標 {data.goals.length}件（この端末のブラウザに保存）
        </p>
        <button className="secondary" onClick={doExport}>
          JSONをコピー
        </button>
        {copied && <p className="small">{copied}</p>}
        {exportText && <textarea className="export" readOnly value={exportText} onFocus={(e) => e.target.select()} />}
      </section>
    </div>
  );
}

/* ============================================================
 * アプリ本体
 * ============================================================ */
export default function App() {
  const [data, setData] = useState(loadData);
  const [screen, setScreen] = useState({ name: 'home' });

  useEffect(() => saveData(data), [data]);
  useEffect(() => window.scrollTo(0, 0), [screen]);

  const handleSave = (session) => {
    const prior = sortSessions(data.sessions).filter((s) => s.date <= session.date);
    const reflection = buildReflection(prior, session);
    setData((d) => ({
      ...d,
      sessions: sortSessions([...d.sessions, session]),
      // 種目連動の結果目標は現在値を記録から更新
      goals: d.goals.map((g) => (g.type === 'result' && g.exercise ? { ...g, current: goalCurrent(g, [...d.sessions, session]) } : g))
    }));
    setScreen({ name: 'review', session, reflection });
  };

  const handleUndo = () => {
    if (!confirm('この記録を取り消しますか？')) return;
    setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s !== screen.session) }));
    setScreen({ name: 'home' });
  };

  return (
    <div className="app">
      <style>{CSS}</style>
      {screen.name === 'home' && <Home data={data} onStart={(part) => setScreen({ name: 'menu', part })} />}
      {screen.name === 'menu' && <Menu part={screen.part} data={data} onSave={handleSave} onCancel={() => setScreen({ name: 'home' })} />}
      {screen.name === 'review' && (
        <Review session={screen.session} reflection={screen.reflection} onHome={() => setScreen({ name: 'home' })} onUndo={handleUndo} />
      )}
      {screen.name === 'goals' && <Goals data={data} setGoals={(goals) => setData((d) => ({ ...d, goals }))} />}

      {(screen.name === 'home' || screen.name === 'goals') && (
        <nav className="tabs">
          <button className={screen.name === 'home' ? 'on' : ''} onClick={() => setScreen({ name: 'home' })}>
            ホーム
          </button>
          <button className={screen.name === 'goals' ? 'on' : ''} onClick={() => setScreen({ name: 'goals' })}>
            目標
          </button>
        </nav>
      )}
    </div>
  );
}

/* ============================================================
 * スタイル
 * ============================================================ */
const CSS = `
:root {
  --bg: #f4f5f7; --card: #fff; --text: #1d232b; --muted: #6b7480; --line: #e2e5ea;
  --accent: #1f3a5f; --accent-soft: #e6edf6; --pr: #8a6d1d; --pr-bg: #fbf3dc; --warn: #8a4b1d;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111418; --card: #1b2027; --text: #e8ebef; --muted: #98a1ad; --line: #2c333c;
    --accent: #8fb3e0; --accent-soft: #22303f; --pr: #e6c56b; --pr-bg: #3a3220; --warn: #e0a070;
  }
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif;
  -webkit-text-size-adjust: 100%; }
button { font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
input, select, textarea { font: inherit; color: inherit; }
h1 { font-size: 22px; margin: 8px 0 12px; }
h2 { font-size: 14px; color: var(--muted); font-weight: 600; margin: 12px 0 8px; }
.app { max-width: 480px; margin: 0 auto; min-height: 100vh; }
.screen { padding: 16px 16px calc(88px + env(safe-area-inset-bottom)); }
.screen.with-footer { padding-bottom: calc(150px + env(safe-area-inset-bottom)); }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; }
.muted { color: var(--muted); }
.small { font-size: 13px; }
.tiny { font-size: 11px; }
.center { display: block; margin: 12px auto; }

.today { font-size: 26px; }
.parts { display: grid; gap: 10px; margin-bottom: 16px; }
.part-btn { padding: 20px; font-size: 20px; font-weight: 700; border-radius: 12px; border: none;
  background: var(--accent); color: #fff; }
@media (prefers-color-scheme: dark) { .part-btn { color: #0f1520; } }
.streak { display: flex; align-items: baseline; gap: 6px; }
.streak-num { font-size: 36px; font-weight: 700; }
.streak-unit { font-size: 15px; }
.tag { font-size: 12px; padding: 2px 8px; border-radius: 99px; background: var(--accent-soft); }
.recent { list-style: none; padding: 0; margin: 0; }
.recent li, .log li { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--line); }
.recent li:last-child, .log li:last-child { border-bottom: none; }
.log { list-style: none; padding: 0; margin: 0; font-size: 14px; }

.goal-row { margin-bottom: 14px; }
.goal-head { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; }
.goal-val { font-variant-numeric: tabular-nums; }
.goal-ctrl { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; gap: 8px; }
.bar { height: 8px; background: var(--line); border-radius: 99px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--accent); border-radius: 99px; }

.menu-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.menu-head h1 { margin: 0; }
.date { border: 1px solid var(--line); background: var(--card); border-radius: 8px; padding: 4px 6px; font-size: 14px; }
.link { background: none; border: none; color: var(--accent); padding: 6px 4px; }
.link:disabled { color: var(--muted); opacity: .5; }
.ex.off { opacity: .6; }
.ex-head { display: flex; justify-content: space-between; align-items: center; }
.ex-name { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; }
.ex-name input { width: 20px; height: 20px; accent-color: var(--accent); }
.ex-body { margin-top: 8px; }
.prev { margin: 0 0 8px; }
.up { color: var(--accent); }
.weight-row { display: flex; align-items: center; gap: 10px; }
.pr { font-size: 11px; color: var(--pr); background: var(--pr-bg); border-radius: 99px; padding: 2px 8px; margin-left: 6px; white-space: nowrap; }

.hstep { display: inline-flex; align-items: center; gap: 6px; }
.hstep button, .vstep button { width: 44px; height: 40px; border-radius: 10px; border: 1px solid var(--line);
  background: var(--accent-soft); font-size: 20px; line-height: 1; }
.num { width: 64px; text-align: center; font-size: 22px; font-weight: 700; border: none; background: transparent;
  font-variant-numeric: tabular-nums; -moz-appearance: textfield; }
.num::-webkit-outer-spin-button, .num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.unit { font-size: 14px; color: var(--muted); margin-left: -4px; }
.sets { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.set { display: flex; flex-direction: column; align-items: center; }
.vstep { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.vstep .num { width: 56px; font-size: 20px; }
.set-ctrl { display: flex; gap: 12px; }

.seg { display: flex; gap: 6px; margin-bottom: 8px; }
.seg button, .feels button, .chip { flex: 1; padding: 10px 6px; border-radius: 10px; border: 1px solid var(--line); background: var(--card); font-size: 14px; }
.seg button.on, .feels button.on { background: var(--accent); color: #fff; border-color: var(--accent); }
@media (prefers-color-scheme: dark) { .seg button.on, .feels button.on { color: #0f1520; } }

.footer { position: fixed; left: 0; right: 0; bottom: 0; background: var(--card); border-top: 1px solid var(--line);
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); max-width: 480px; margin: 0 auto; }
.feels { display: flex; gap: 6px; margin-bottom: 8px; }
.primary { width: 100%; padding: 14px; border-radius: 12px; border: none; background: var(--accent); color: #fff; font-size: 17px; font-weight: 700; }
@media (prefers-color-scheme: dark) { .primary { color: #0f1520; } }
.primary:disabled { background: var(--line); color: var(--muted); }
.secondary { padding: 10px 16px; border-radius: 10px; border: 1px solid var(--accent); background: transparent; color: var(--accent); }

.ref-line { padding: 8px 0; border-bottom: 1px solid var(--line); }
.ref-line:last-child { border-bottom: none; }
.ref-line p { margin: 2px 0 0; line-height: 1.5; }
.ref-label { font-size: 12px; color: var(--accent); font-weight: 700; }
.ref-label.warn { color: var(--warn); }
.ref-label.next { color: var(--text); }

.presets { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.chip { flex: 0 0 auto; padding: 6px 12px; border-radius: 99px; font-size: 13px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--muted); margin-bottom: 10px; }
.field input, .field select { padding: 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--text); font-size: 16px; }
.export { width: 100%; height: 160px; margin-top: 8px; font-family: ui-monospace, monospace; font-size: 11px;
  border: 1px solid var(--line); border-radius: 8px; background: var(--bg); }

.tabs { position: fixed; left: 0; right: 0; bottom: 0; display: flex; background: var(--card); border-top: 1px solid var(--line);
  padding-bottom: env(safe-area-inset-bottom); max-width: 480px; margin: 0 auto; }
.tabs button { flex: 1; padding: 14px; border: none; background: none; color: var(--muted); font-size: 15px; }
.tabs button.on { color: var(--accent); font-weight: 700; }
`;
