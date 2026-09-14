import { useEffect, useState } from 'react';
import { db } from '../db/db';
import type { SurveyCase } from '../types';

export function useCase(caseId: string) {
  const [surveyCase, setSurveyCase] = useState<SurveyCase | null>(null);

  const refresh = async () => {
    const c = await db.cases.get(caseId);
    setSurveyCase(c ?? null);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  return { surveyCase, refresh };
}
