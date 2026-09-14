interface Props {
  onBack?: () => void;
  onSave: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  saving?: boolean;
}

export function BottomNav({ onBack, onSave, onNext, backLabel = '戻る', nextLabel = '次へ', nextDisabled, saving }: Props) {
  return (
    <div className="bottomnav">
      <button className="btn btn-ghost" onClick={onBack} disabled={!onBack} style={{ flex: '0 0 22%' }}>
        {backLabel}
      </button>
      <button className="btn btn-secondary" onClick={onSave} style={{ flex: '0 0 30%' }} disabled={saving}>
        {saving ? '保存中…' : '一時保存'}
      </button>
      <button className="btn btn-primary btn-block" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </button>
    </div>
  );
}
