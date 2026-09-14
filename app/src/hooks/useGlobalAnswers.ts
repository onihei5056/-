import { useCallback, useEffect, useState } from 'react';
import { db } from '../db/db';
import { buildGlobals } from '../utils/calc';
import type { AnswerValue } from '../types';

/**
 * 全セクションの回答を「sectionId.fieldId」をキーにしたフラットなMapで返す。
 * セクションをまたぐ自動計算(建ぺい率=建築面積÷敷地面積 など)で参照する。
 */
export function useGlobalAnswers(caseId: string) {
  const [globals, setGlobals] = useState<Record<string, AnswerValue>>({});

  const refresh = useCallback(async () => {
    const rows = await db.sectionAnswers.where('caseId').equals(caseId).toArray();
    setGlobals(buildGlobals(rows));
  }, [caseId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { globals, refresh };
}
