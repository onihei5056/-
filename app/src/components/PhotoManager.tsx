import { useEffect, useRef, useState } from 'react';
import { db, addAuditLog, getCurrentUser } from '../db/db';
import type { PhotoCategoryKey, PhotoRecord } from '../types';
import { compressImage, rotateImageBlob, blobToDataUrl } from '../utils/image';
import { uid } from '../utils/id';

interface Props {
  caseId: string;
  category: PhotoCategoryKey;
  refId?: string;
  title: string;
  note?: string;
}

function keepOriginalSetting(): boolean {
  return localStorage.getItem('survey-keep-original-photo') === '1';
}

export function PhotoManager({ caseId, category, refId, title, note }: Props) {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [openPhotoId, setOpenPhotoId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const retakeInputRef = useRef<HTMLInputElement>(null);
  const retakeTargetId = useRef<string | null>(null);

  const load = async () => {
    const list = await db.photos.where({ caseId, category }).toArray();
    const filtered = list.filter((p) => (refId ? p.refId === refId : !p.refId)).sort((a, b) => a.order - b.order);
    setPhotos(filtered);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, category, refId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        photos.map(async (p) => [p.id, await blobToDataUrl(p.blob)] as const)
      );
      if (!cancelled) setUrls(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [photos]);

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      let order = photos.length ? Math.max(...photos.map((p) => p.order)) + 1 : 0;
      for (const file of Array.from(files)) {
        const compressed = await compressImage(file);
        const record: PhotoRecord = {
          id: uid(),
          caseId,
          category,
          refId,
          blob: compressed,
          originalBlob: keepOriginalSetting() ? file : undefined,
          mimeType: 'image/jpeg',
          takenAt: Date.now(),
          photographer: getCurrentUser(),
          comment: '',
          order: order++,
          rotation: 0,
          includeInPdf: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await db.photos.add(record);
      }
      await addAuditLog(caseId, 'photo_add', `${title}に${files.length}枚の写真を追加`);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const updatePhoto = async (id: string, patch: Partial<PhotoRecord>) => {
    await db.photos.update(id, { ...patch, updatedAt: Date.now() });
    await load();
  };

  const removePhoto = async (id: string) => {
    if (!window.confirm('この写真を削除します。よろしいですか?')) return;
    await db.photos.delete(id);
    await addAuditLog(caseId, 'photo_delete', `${title}の写真を削除`);
    setOpenPhotoId(null);
    await load();
  };

  const rotate = async (photo: PhotoRecord, deg: 90 | 270) => {
    setBusy(true);
    try {
      const rotated = await rotateImageBlob(photo.blob, deg);
      await updatePhoto(photo.id, { blob: rotated, rotation: (((photo.rotation + deg) % 360) as 0 | 90 | 180 | 270) });
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = photos[index];
    const swapWith = photos[index + dir];
    if (!target || !swapWith) return;
    await db.photos.update(target.id, { order: swapWith.order });
    await db.photos.update(swapWith.id, { order: target.order });
    await load();
  };

  const handleRetakeSelected = async (file: File) => {
    const id = retakeTargetId.current;
    if (!id) return;
    setBusy(true);
    try {
      const compressed = await compressImage(file);
      await updatePhoto(id, { blob: compressed, rotation: 0, takenAt: Date.now() });
    } finally {
      setBusy(false);
      retakeTargetId.current = null;
    }
  };

  const openPhoto = photos.find((p) => p.id === openPhotoId);

  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      {note && <div className="note-box">📷 撮影上の注意: {note}</div>}

      <div className="photo-capture-row">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => addFiles(e.target.files).then(() => (e.target.value = ''))}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files).then(() => (e.target.value = ''))}
        />
        <input
          ref={retakeInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleRetakeSelected(file);
            e.target.value = '';
          }}
        />
        <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => cameraInputRef.current?.click()}>
          📷 カメラで撮影
        </button>
        <button type="button" className="btn btn-secondary btn-block" disabled={busy} onClick={() => galleryInputRef.current?.click()}>
          🖼 写真から選択
        </button>
      </div>

      <div className="photo-grid">
        {photos.map((p, idx) => (
          <div className="photo-thumb" key={p.id} onClick={() => setOpenPhotoId(p.id)}>
            {urls[p.id] && <img src={urls[p.id]} alt={`${title} ${idx + 1}`} />}
            <span className="photo-thumb__badge">
              {idx + 1}/{photos.length}
            </span>
            {!p.includeInPdf && <div className="photo-thumb__pdf-off">PDF非掲載</div>}
          </div>
        ))}
      </div>
      {photos.length === 0 && <div className="field-note">まだ写真が登録されていません。</div>}

      {openPhoto && (
        <div className="modal-backdrop" onClick={() => setOpenPhotoId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {urls[openPhoto.id] && (
              <img src={urls[openPhoto.id]} alt="拡大表示" style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />
            )}
            <div className="field">
              <label className="field-label">コメント</label>
              <textarea
                className="input"
                rows={2}
                value={openPhoto.comment}
                onChange={(e) => updatePhoto(openPhoto.id, { comment: e.target.value })}
              />
            </div>
            <div className="field-note">
              撮影日時: {new Date(openPhoto.takenAt).toLocaleString('ja-JP')} / 撮影者: {openPhoto.photographer}
            </div>
            <div className="photo-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => rotate(openPhoto, 270)}>
                ⟲ 左回転
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => rotate(openPhoto, 90)}>
                ⟳ 右回転
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  retakeTargetId.current = openPhoto.id;
                  retakeInputRef.current?.click();
                }}
              >
                📷 撮り直し
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => move(photos.findIndex((p) => p.id === openPhoto.id), -1)}
              >
                ↑ 順序を上げる
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => move(photos.findIndex((p) => p.id === openPhoto.id), 1)}
              >
                ↓ 順序を下げる
              </button>
            </div>
            <div className="photo-actions">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={openPhoto.includeInPdf}
                  onChange={(e) => updatePhoto(openPhoto.id, { includeInPdf: e.target.checked })}
                />
                PDFに掲載する
              </label>
            </div>
            <div className="photo-actions" style={{ marginTop: 12, justifyContent: 'space-between' }}>
              <button className="btn btn-danger btn-sm" onClick={() => removePhoto(openPhoto.id)}>
                削除
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setOpenPhotoId(null)}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
