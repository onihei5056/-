import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  GeneratedImage,
  GenerationCondition,
  GenerationRecord,
  PropertyInfo,
  RoomTypeId,
  SourceImage,
  StyleId,
} from '../types';
import { UploadPanel } from '../components/UploadPanel';
import { PropertyForm } from '../components/PropertyForm';
import { StyleSelector } from '../components/StyleSelector';
import {
  ChangeItemSelector,
  FreeTextInput,
  ReformSelector,
  RoomTypeSelector,
  TargetSelector,
} from '../components/GenerationOptions';
import { BeforeAfterSlider, SideBySide } from '../components/BeforeAfter';
import { ResultGallery } from '../components/ResultGallery';
import { ResultDetail } from '../components/ResultDetail';
import { ImageModal } from '../components/ImageModal';
import { LoadingOverlay, SkeletonGrid } from '../components/Loading';
import { Disclaimer } from '../components/Disclaimer';
import { QuickAdjust } from '../components/QuickAdjust';
import { generateImage, MOCK_LATENCY_MS } from '../api/generateImage';
import { STYLE_PRESETS } from '../mock/styles';
import { sampleSourceImage, SAMPLE_PROPERTY_A } from '../mock/sampleProjects';
import { useAppStore } from '../store/AppStore';
import { useIsPhone } from '../hooks/useMediaQuery';
import { downloadImage } from '../utils/image';
import { safeFileName } from '../utils/format';
import { IconImage, IconLock, IconSliders, IconSparkle } from '../icons';

const EMPTY_PROPERTY: PropertyInfo = {
  name: '',
  address: '',
  roomNumber: '',
  staff: '',
  purpose: '',
  memo: '',
};

const DEFAULT_CONDITION: GenerationCondition = {
  roomType: 'ldk',
  styles: ['natural', 'modern', 'nordic'],
  changeItems: ['placeFurniture', 'rug', 'plant', 'curtain', 'art'],
  reformItems: [],
  targets: ['family'],
  freeText: '',
};

interface Props {
  /** 履歴・お気に入りから開いた案件（あれば初期値として読み込む） */
  initialRecord?: GenerationRecord | null;
  uploadInputRef: React.RefObject<HTMLInputElement>;
  notify: (message: string) => void;
  burnNoticeOnDownload: boolean;
  /** 履歴画面へ移動する（出先で既存案件の写真を使うとき用） */
  onOpenHistory: () => void;
}

export function GeneratePage({
  initialRecord,
  uploadInputRef,
  notify,
  burnNoticeOnDownload,
  onOpenHistory,
}: Props) {
  const { addRecord, updateRecord, toggleFavorite, isFavorite } = useAppStore();

  const [source, setSource] = useState<SourceImage | null>(initialRecord?.source ?? null);
  const [property, setProperty] = useState<PropertyInfo>(initialRecord?.property ?? EMPTY_PROPERTY);
  const [condition, setCondition] = useState<GenerationCondition>(() => {
    if (initialRecord?.condition) return initialRecord.condition;
    // スマホは1枚ずつ確認する使い方が中心のため、既定のスタイルは1つに絞る
    const phone = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
    return phone ? { ...DEFAULT_CONDITION, styles: ['natural'] } : DEFAULT_CONDITION;
  });
  const [results, setResults] = useState<GeneratedImage[]>(initialRecord?.results ?? []);
  const [recordId, setRecordId] = useState<string | null>(initialRecord?.id ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(initialRecord?.results[0]?.id ?? null);
  const [loading, setLoading] = useState<{ on: boolean; current: string; progress: number }>({
    on: false,
    current: '',
    progress: 0,
  });
  const [modal, setModal] = useState<{ src: string; title: string; imageId?: string } | null>(null);
  const [compareMode, setCompareMode] = useState<'slider' | 'sbs'>('slider');
  // スマートフォンでは3カラムを並べられないため、「設定」「結果」の2タブに分ける
  const isPhone = useIsPhone();
  const [mobileTab, setMobileTab] = useState<'settings' | 'results'>(
    initialRecord ? 'results' : 'settings',
  );
  const compareRef = useRef<HTMLDivElement>(null);
  const styleSectionRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => results.find((r) => r.id === selectedId) ?? results[0] ?? null,
    [results, selectedId],
  );

  const setCond = <K extends keyof GenerationCondition>(key: K, value: GenerationCondition[K]) =>
    setCondition((c) => ({ ...c, [key]: value }));

  const toggleIn = (list: string[], id: string) =>
    list.includes(id) ? list.filter((v) => v !== id) : [...list, id];

  // ----------------------------------------------------------
  // 生成
  // ----------------------------------------------------------
  const runGenerate = useCallback(async () => {
    if (!source) {
      notify('先に室内写真をアップロードしてください');
      return;
    }
    if (condition.styles.length === 0) {
      notify('インテリアスタイルを1つ以上選択してください');
      return;
    }

    const roomType: RoomTypeId = source.isSample && source.sampleRoomType ? source.sampleRoomType : condition.roomType;
    const cond = { ...condition, roomType };

    setLoading({ on: true, current: STYLE_PRESETS.find((s) => s.id === cond.styles[0])?.name ?? '', progress: 0.05 });
    const images: GeneratedImage[] = [];
    try {
      for (let i = 0; i < cond.styles.length; i++) {
        const styleId = cond.styles[i];
        setLoading({
          on: true,
          current: STYLE_PRESETS.find((s) => s.id === styleId)?.name ?? '',
          progress: (i + 0.2) / cond.styles.length,
        });
        // モックのため、実際の生成時間を模した待機を入れる
        await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS / cond.styles.length));
        const { image } = await generateImage({ source, condition: cond, styleId, property });
        images.push(image);
      }
      const record: GenerationRecord = {
        id: `rec_${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
        property,
        condition: cond,
        source,
        results: images,
        favoriteImageIds: [],
      };
      setResults(images);
      setRecordId(record.id);
      setSelectedId(images[0]?.id ?? null);
      addRecord(record);
      setMobileTab('results');
      notify(`${images.length}件の候補を生成し、履歴に保存しました`);
    } catch (e) {
      console.error(e);
      notify('生成に失敗しました。もう一度お試しください');
    } finally {
      setLoading({ on: false, current: '', progress: 1 });
    }
  }, [source, condition, property, addRecord, notify]);

  /** 1スタイルだけ生成して結果に反映する（再生成／別スタイル追加） */
  const runSingle = useCallback(
    async (
      styleId: StyleId,
      replaceImageId?: string,
      /** クイック変更のように、その場で条件を差し替えて作り直す場合に指定する */
      conditionOverride?: Partial<GenerationCondition>,
      /** 完了時のメッセージ（省略時は再生成／追加生成の既定文言） */
      message?: string,
    ) => {
      if (!source) return;
      const styleName = STYLE_PRESETS.find((s) => s.id === styleId)?.name ?? '';
      setLoading({ on: true, current: styleName, progress: 0.4 });
      try {
        await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS * 0.7));
        const { image } = await generateImage({
          source,
          condition: {
            ...condition,
            ...conditionOverride,
            roomType: source.isSample && source.sampleRoomType ? source.sampleRoomType : condition.roomType,
          },
          styleId,
          property,
          // クイック変更は条件そのものが変わるため、ゆらぎ（seed）は加えない
          variantSeed: conditionOverride ? undefined : Date.now() % 10000,
        });
        // setResultsの更新関数の中で他コンポーネントのstateを更新しないよう、
        // 次の配列を先に確定させてから反映する（Reactの警告回避）
        const next = replaceImageId
          ? results.map((p) => (p.id === replaceImageId ? image : p))
          : [...results, image];
        setResults(next);
        if (recordId) updateRecord(recordId, (rec) => ({ ...rec, results: next }));
        setSelectedId(image.id);
        setMobileTab('results');
        notify(
          message ??
            (replaceImageId ? `「${styleName}」を再生成しました` : `「${styleName}」を追加生成しました`),
        );
      } finally {
        setLoading({ on: false, current: '', progress: 1 });
      }
    },
    [source, condition, property, results, recordId, updateRecord, notify],
  );

  // ----------------------------------------------------------
  // 個別操作
  // ----------------------------------------------------------
  const handleDownload = useCallback(
    async (image: GeneratedImage) => {
      const base = `${safeFileName(property.name || 'RoomVisualizer')}_${image.styleName}`;
      await downloadImage(image.dataUrl, base, burnNoticeOnDownload);
      notify(burnNoticeOnDownload ? '注意文を入れて画像を保存しました' : '画像を保存しました');
    },
    [property.name, burnNoticeOnDownload, notify],
  );

  const handleFavorite = useCallback(
    (imageId: string) => {
      if (!recordId) {
        notify('生成後にお気に入りへ保存できます');
        return;
      }
      toggleFavorite(recordId, imageId);
      notify(isFavorite(recordId, imageId) ? 'お気に入りから外しました' : 'お気に入りに保存しました');
    },
    [recordId, toggleFavorite, isFavorite, notify],
  );

  const handleShare = useCallback(async () => {
    // モック版ではクリップボードへのコピーで代替（将来的に共有リンク発行へ差し替え）
    try {
      await navigator.clipboard.writeText(
        `【${property.name || '物件'}】${selected?.styleName ?? ''}のイメージ画像（Room Visualizerで生成）`,
      );
      notify('共有用のテキストをコピーしました（モック）');
    } catch {
      notify('共有機能はモック版では未対応です');
    }
  }, [property.name, selected, notify]);

  const useSample = useCallback(() => {
    setSource(sampleSourceImage('ldk', 'グリーンハイツ江坂302_LDK.jpg'));
    setProperty(SAMPLE_PROPERTY_A);
    setCondition((c) => ({ ...c, roomType: 'ldk' }));
    notify('サンプル写真を読み込みました');
  }, [notify]);

  /**
   * クイック変更：リフォーム項目を切り替えて、表示中の画像だけを作り直す。
   * 設定パネルの状態も同時に更新するため、PCの左パネルとも内容が一致する。
   */
  const applyQuickAdjust = useCallback(
    async (nextReformItems: string[]) => {
      if (!selected) return;
      setCondition((c) => ({ ...c, reformItems: nextReformItems }));
      await runSingle(selected.styleId, selected.id, { reformItems: nextReformItems }, '内装を変更しました');
      // 変更後の画像がすぐ見えるように、比較エリアまで戻す
      compareRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [selected, runSingle],
  );

  const scrollToCompare = () => {
    setMobileTab('results');
    // タブ切り替え後にスクロールするため、描画を1フレーム待つ
    window.requestAnimationFrame(() =>
      compareRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
  };

  const addOtherStyle = () => {
    const used = new Set(results.map((r) => r.styleId));
    const next = STYLE_PRESETS.find((s) => !used.has(s.id));
    if (!next) {
      notify('すべてのスタイルを生成済みです');
      return;
    }
    if (!condition.styles.includes(next.id)) setCond('styles', [...condition.styles, next.id]);
    void runSingle(next.id);
    styleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const selectedIsFavorite = !!(recordId && selected && isFavorite(recordId, selected.id));

  return (
    <div className={`page${isPhone && mobileTab === 'settings' ? ' has-mobile-bar' : ''}`}>
      {/* スマートフォン用：設定／結果の切り替え */}
      {isPhone && (
        <div className="mobile-tabs">
          <button
            type="button"
            className={mobileTab === 'settings' ? 'on' : ''}
            onClick={() => setMobileTab('settings')}
          >
            <IconSliders size={15} />
            条件を設定
          </button>
          <button
            type="button"
            className={mobileTab === 'results' ? 'on' : ''}
            onClick={() => setMobileTab('results')}
          >
            <IconImage size={15} />
            生成結果
            {results.length > 0 && <span className="mt-count">{results.length}</span>}
          </button>
        </div>
      )}

      <div className="workspace">
        {/* ============ 左：設定パネル ============ */}
        <div
          className={`col col-left col-side${isPhone && mobileTab !== 'settings' ? ' phone-hide' : ''}`}
        >
          <UploadPanel
            source={source}
            onChange={(s) => {
              setSource(s);
              if (!s) {
                setResults([]);
                setRecordId(null);
              }
            }}
            onUseSample={useSample}
            onOpenHistory={onOpenHistory}
            inputRef={uploadInputRef}
          />
          <PropertyForm value={property} onChange={setProperty} />
          <RoomTypeSelector value={condition.roomType} onChange={(v) => setCond('roomType', v)} />
          <div ref={styleSectionRef}>
            <StyleSelector
              roomType={condition.roomType}
              selected={condition.styles}
              onToggle={(id) => setCond('styles', toggleIn(condition.styles, id) as StyleId[])}
            />
          </div>
          <ChangeItemSelector
            selected={condition.changeItems}
            onToggle={(id) => setCond('changeItems', toggleIn(condition.changeItems, id))}
          />
          {/* スマホでは下位の設定を折りたたみ、スクロール量を減らす */}
          <ReformSelector
            selected={condition.reformItems}
            onToggle={(id) => setCond('reformItems', toggleIn(condition.reformItems, id))}
            defaultOpen={!isPhone}
          />
          <TargetSelector
            selected={condition.targets}
            onToggle={(id) => setCond('targets', toggleIn(condition.targets, id))}
            defaultOpen={!isPhone}
          />
          <FreeTextInput
            value={condition.freeText}
            onChange={(v) => setCond('freeText', v)}
            defaultOpen={!isPhone}
          />

          {!isPhone && (
            <div className="card card-pad generate-box">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => void runGenerate()}
                disabled={loading.on || !source || condition.styles.length === 0}
              >
                <IconSparkle size={17} />
                {loading.on ? '生成中…' : 'AIで生成する'}
              </button>
              <p className="generate-note">
                選択中：{condition.styles.length}スタイル／変更{condition.changeItems.length}項目
              </p>
            </div>
          )}
        </div>

        {/* ============ 中央：生成結果 ============ */}
        <div className={`col col-center${isPhone && mobileTab !== 'results' ? ' phone-hide' : ''}`}>
          <div className="page-head">
            <h1>生成結果</h1>
            <p>同じお部屋から、複数のインテリアイメージを比較できます。</p>
          </div>

          <section className="card" style={{ position: 'relative' }} ref={compareRef}>
            <div className="card-head">
              <h2>元写真との比較</h2>
              <span className="head-sub" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span className="ba-toggle">
                  <button
                    type="button"
                    className={compareMode === 'slider' ? 'on' : ''}
                    onClick={() => setCompareMode('slider')}
                  >
                    スライダー
                  </button>
                  <button
                    type="button"
                    className={compareMode === 'sbs' ? 'on' : ''}
                    onClick={() => setCompareMode('sbs')}
                  >
                    左右に並べる
                  </button>
                </span>
              </span>
            </div>
            <div className="card-body">
              {source && selected ? (
                compareMode === 'slider' ? (
                  <BeforeAfterSlider beforeSrc={source.dataUrl} afterSrc={selected.dataUrl} />
                ) : (
                  <SideBySide beforeSrc={source.dataUrl} afterSrc={selected.dataUrl} />
                )
              ) : (
                <div className="empty-state" style={{ border: 0, padding: '34px 16px' }}>
                  <div className="icon">
                    <IconImage size={34} />
                  </div>
                  <h3>まだ生成結果がありません</h3>
                  <p>
                  {isPhone
                    ? '「条件を設定」タブで写真と条件を選び、「AIで生成する」を押してください。'
                    : '左のパネルで写真と条件を選び、「AIで生成する」を押してください。'}
                </p>
                </div>
              )}
              <p className="hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconLock size={13} />
                窓・柱・梁・ドア・間取り・撮影アングルは元写真のまま。家具と内装のみを変更しています。
              </p>

              {/* 出先で「壁紙だけ変えて見せたい」に1タップで応えるための導線 */}
              {selected && (
                <QuickAdjust
                  selected={condition.reformItems}
                  onApply={(next) => void applyQuickAdjust(next)}
                  disabled={loading.on}
                  styleName={selected.styleName}
                />
              )}
            </div>
            {loading.on && <LoadingOverlay current={loading.current} progress={loading.progress} />}
          </section>

          <div className="page-head" style={{ marginTop: 6 }}>
            <h2 style={{ margin: 0, fontSize: 15 }}>生成候補一覧</h2>
            <p>
              {isPhone
                ? '画像をタップすると全画面で表示します。スタイルの詳細は下に表示されます。'
                : '画像をクリックすると右側に詳細が表示されます。選択中の画像をもう一度クリックすると拡大します。'}
            </p>
          </div>

          {loading.on && results.length === 0 ? (
            <SkeletonGrid count={condition.styles.length || 3} />
          ) : source && results.length > 0 ? (
            <ResultGallery
              source={source}
              results={results}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
              onExpand={(img) =>
                img === 'source'
                  ? setModal({ src: source.dataUrl, title: '元の写真' })
                  : setModal({ src: img.dataUrl, title: img.styleName, imageId: img.id })
              }
              onDownload={(img) => void handleDownload(img)}
              onRegenerate={(img) => void runSingle(img.styleId, img.id)}
              isFavorite={(id) => !!(recordId && isFavorite(recordId, id))}
              onToggleFavorite={handleFavorite}
              expandOnFirstTap={isPhone}
            />
          ) : (
            <div className="empty-state">
              <div className="icon">
                <IconSparkle size={38} />
              </div>
              <h3>生成結果はここに並びます</h3>
              <p>
                サンプル写真でもすぐに試せます。
                {isPhone ? '「条件を設定」タブの' : '左パネルの'}「サンプル写真で試す」からお試しください。
              </p>
            </div>
          )}

          <Disclaimer />
        </div>

        {/* ============ 右：詳細 ============ */}
        <div
          className={`col col-right col-side${isPhone && mobileTab !== 'results' ? ' phone-hide' : ''}`}
        >
          <ResultDetail
            image={selected}
            property={property}
            roomType={condition.roomType}
            isFavorite={selectedIsFavorite}
            onToggleFavorite={() => selected && handleFavorite(selected.id)}
            onDownload={() => selected && void handleDownload(selected)}
            onShare={() => void handleShare()}
            onRegenerateSame={() => selected && void runSingle(selected.styleId, selected.id)}
            onRegenerateOther={addOtherStyle}
            onCompare={scrollToCompare}
          />
        </div>
      </div>

      {/* スマートフォン用：常に押せる位置に生成ボタンを固定表示 */}
      {isPhone && mobileTab === 'settings' && (
        <div className="mobile-generate-bar">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => void runGenerate()}
            disabled={loading.on || !source || condition.styles.length === 0}
          >
            <IconSparkle size={17} />
            {loading.on ? '生成中…' : 'AIで生成する'}
          </button>
          <p className="generate-note">
            {source
              ? `選択中：${condition.styles.length}スタイル／変更${condition.changeItems.length}項目`
              : 'まず室内写真を撮影・選択してください'}
          </p>
        </div>
      )}

      {modal && (
        <ImageModal
          src={modal.src}
          title={modal.title}
          subtitle={property.name || undefined}
          isFavorite={!!(recordId && modal.imageId && isFavorite(recordId, modal.imageId))}
          onToggleFavorite={modal.imageId ? () => handleFavorite(modal.imageId!) : undefined}
          onDownload={
            modal.imageId
              ? () => {
                  const img = results.find((r) => r.id === modal.imageId);
                  if (img) void handleDownload(img);
                }
              : undefined
          }
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
