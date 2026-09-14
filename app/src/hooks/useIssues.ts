import { useCallback, useEffect, useState } from 'react';
import { validateCase } from '../utils/validation';
import type { ValidationIssue } from '../types';

export function useIssues(caseId: string) {
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  const refresh = useCallback(async () => {
    const result = await validateCase(caseId);
    setIssues(result);
    return result;
  }, [caseId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { issues, refresh };
}
