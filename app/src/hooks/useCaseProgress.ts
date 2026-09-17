import { useCallback, useEffect, useState } from 'react';
import { db } from '../db/db';
import { computeAllProgress, type Progress } from '../utils/progress';

export interface CaseProgress {
  overall: Progress;
  bySection: Record<string, Progress>;
  photoCount: number;
  wallCount: number;
}

const EMPTY: CaseProgress = {
  overall: { filled: 0, total: 0, percent: 0 },
  bySection: {},
  photoCount: 0,
  wallCount: 0
};

/** 目次(大分類タブ)と画面上部の進捗表示に使う集計 */
export function useCaseProgress(caseId: string) {
  const [progress, setProgress] = useState<CaseProgress>(EMPTY);

  const refresh = useCallback(async () => {
    const [rows, photos, walls] = await Promise.all([
      db.sectionAnswers.where('caseId').equals(caseId).toArray(),
      db.photos.where('caseId').equals(caseId).count(),
      db.wallSurveys.where('caseId').equals(caseId).count()
    ]);
    const { overall, bySection } = computeAllProgress(rows);
    setProgress({ overall, bySection, photoCount: photos, wallCount: walls });
  }, [caseId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { progress, refresh };
}
