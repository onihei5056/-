import { useAppStore } from '../store/AppStore';
import { DISCLAIMER } from '../mock/options';
import { Disclaimer } from '../components/Disclaimer';

interface Props {
  burnNoticeOnDownload: boolean;
  onChangeBurnNotice: (v: boolean) => void;
  notify: (m: string) => void;
}

/** 設定画面（モック版：保存先と注意表示の扱いのみ） */
export function SettingsPage({ burnNoticeOnDownload, onChangeBurnNotice, notify }: Props) {
  const { records, favorites, resetToSamples } = useAppStore();

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 940 }}>
        <div className="page-head" style={{ marginBottom: 16 }}>
          <h1>設定</h1>
          <p>モック版のため、設定できる項目は限られています。</p>
        </div>

        <section className="card">
          <div className="card-head">
            <h2>画像の取り扱い</h2>
          </div>
          <div className="card-body">
            <div className="setting-row">
              <div className="lbl">ダウンロード時の注意文</div>
              <div className="val">
                <label className="check" style={{ padding: 0 }}>
                  <input
                    type="checkbox"
                    checked={burnNoticeOnDownload}
                    onChange={(e) => onChangeBurnNotice(e.target.checked)}
                  />
                  <span>画像の下部に注意文を焼き込んで保存する</span>
                </label>
                <p className="hint">「{DISCLAIMER}」の一文が画像に追加されます。</p>
              </div>
            </div>
            <div className="setting-row">
              <div className="lbl">画像生成の接続先</div>
              <div className="val">
                現在：<code className="inline">モック（サンプル画像を生成）</code>
                <p className="hint">
                  外部APIへは接続していないため、利用料金は発生しません。
                  接続先は <code className="inline">.env</code> の{' '}
                  <code className="inline">VITE_IMAGE_SOURCE</code> と{' '}
                  <code className="inline">VITE_IMAGE_API_ENDPOINT</code> で切り替える想定です。
                  APIキーはフロントエンドに置かず、自社サーバー側で保持してください。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <h2>データ</h2>
          </div>
          <div className="card-body">
            <div className="setting-row">
              <div className="lbl">保存先</div>
              <div className="val">
                このブラウザの LocalStorage
                <p className="hint">
                  履歴 {records.length}件／お気に入り {favorites.length}件を保持しています。
                  端末・ブラウザをまたいだ共有はできません（将来的に社内サーバー保存へ移行する想定）。
                </p>
              </div>
            </div>
            <div className="setting-row">
              <div className="lbl">初期化</div>
              <div className="val">
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    if (window.confirm('履歴とお気に入りを削除し、サンプルデータに戻します。よろしいですか？')) {
                      resetToSamples();
                      notify('サンプルデータに戻しました');
                    }
                  }}
                >
                  履歴・お気に入りを初期化する
                </button>
                <p className="hint">サンプル案件2件の状態に戻します。</p>
              </div>
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <h2>免責表示</h2>
          </div>
          <div className="card-body">
            <Disclaimer />
            <p className="hint">
              生成結果の画面下部・拡大表示・ダウンロード画像に表示されます。文言は
              <code className="inline">src/mock/options.ts</code> の{' '}
              <code className="inline">DISCLAIMER</code> で変更できます。
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
