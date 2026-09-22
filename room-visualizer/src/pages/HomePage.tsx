import { useAppStore } from '../store/AppStore';
import { formatDateTime } from '../utils/format';
import { Disclaimer } from '../components/Disclaimer';
import { IconHeart, IconHistory, IconImage, IconLock, IconSparkle, IconUpload } from '../icons';

interface Props {
  onStart: () => void;
  onGoHistory: () => void;
}

/** ホーム：使い方と最近の案件 */
export function HomePage({ onStart, onGoHistory }: Props) {
  const { records, favorites } = useAppStore();
  const recent = records.slice(0, 3);

  return (
    <div className="page">
      <div className="container">
        <section className="hero">
          <h1>AIで、理想の空間をすぐに。</h1>
          <p>
            空室・中古住宅・マンションの室内写真から、家具を配置した「完成後のイメージ画像」を作成します。
            窓・柱・梁・ドア・間取り・撮影アングルはそのままに、家具と内装だけを変更するため、
            物件写真として違和感のないイメージをお客様に提示できます。
          </p>
          <button type="button" className="btn" onClick={onStart}>
            <IconUpload size={16} />
            室内写真をアップロードして始める
          </button>
        </section>

        <div className="section-title" style={{ fontSize: 14, marginBottom: 10 }}>使い方は3ステップ</div>
        <div className="flow-steps" style={{ marginBottom: 24 }}>
          <div className="card flow-step">
            <span className="num">1</span>
            <div>
              <h4>部屋写真を入れる</h4>
              <p>空室の写真をドラッグ＆ドロップ。室内全体が写った写真が最適です。</p>
            </div>
          </div>
          <div className="card flow-step">
            <span className="num">2</span>
            <div>
              <h4>条件を選ぶ</h4>
              <p>部屋タイプ・インテリアスタイル・変更したい項目・ターゲットを選択します。</p>
            </div>
          </div>
          <div className="card flow-step">
            <span className="num">3</span>
            <div>
              <h4>生成結果を見る</h4>
              <p>複数スタイルを並べて比較。お気に入りに保存して提案資料に使えます。</p>
            </div>
          </div>
        </div>

        <div className="feature-grid" style={{ marginBottom: 24 }}>
          <div className="card feature-card">
            <span className="ic">
              <IconLock size={18} />
            </span>
            <h3>物件の構造は変えない</h3>
            <p>
              窓位置・柱・梁・ドア・間取り・部屋の形・撮影アングルは維持します。
              変更するのは家具・インテリア・床・壁・照明のみです。
            </p>
          </div>
          <div className="card feature-card">
            <span className="ic">
              <IconImage size={18} />
            </span>
            <h3>同じ部屋で並べて比較</h3>
            <p>
              1枚の元写真から複数スタイルを生成し、Before/Afterスライダーで違いをその場で説明できます。
            </p>
          </div>
          <div className="card feature-card">
            <span className="ic">
              <IconHeart size={18} />
            </span>
            <h3>案件ごとに保存</h3>
            <p>
              物件名・部屋番号・担当者とあわせて履歴に保存。お気に入りの候補をすぐ取り出せます。
            </p>
          </div>
        </div>

        <div className="page-head" style={{ marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>最近の案件</h2>
          <p>
            履歴 {records.length}件／お気に入り {favorites.length}件
          </p>
          <span className="spacer" />
          <button type="button" className="btn btn-sm" onClick={onGoHistory}>
            <IconHistory size={14} />
            履歴をすべて見る
          </button>
        </div>
        <div className="fav-grid" style={{ marginBottom: 20 }}>
          {recent.map((r) => (
            <article className="card" key={r.id} style={{ overflow: 'hidden' }}>
              <img
                src={r.results[0]?.dataUrl ?? r.source.dataUrl}
                alt={r.property.name}
                style={{ width: '100%', display: 'block', aspectRatio: '3 / 2', objectFit: 'cover' }}
              />
              <div className="card-pad" style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {r.property.name || '（物件名なし）'} {r.property.roomNumber}
                </div>
                <div className="hint" style={{ margin: '2px 0 0' }}>
                  {formatDateTime(r.createdAt)}／{r.results.length}パターン
                </div>
              </div>
            </article>
          ))}
          {recent.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="icon">
                <IconSparkle size={30} />
              </div>
              <h3>まだ案件がありません</h3>
              <p>「画像生成」からお試しください。</p>
            </div>
          )}
        </div>

        <Disclaimer />
      </div>
    </div>
  );
}
