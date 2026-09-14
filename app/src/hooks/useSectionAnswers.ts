import { useCallback, useEffect, useRef, useState } from 'react';
import { db, sectionAnswerKey, getDeviceId, getCurrentUser } from '../db/db';
import type { AnswerValue } from '../types';
import type { SaveState } from '../components/TopBar';

const AUTOSAVE_DELAY_MS = 900;

export function useSectionAnswers(caseId: string, sectionId: string) {
  const [values, setValues] = useState<Record<string, AnswerValue>>({});
  const [manualOverride, setManualOverride] = useState<Record<string, boolean>>({});
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<{ values: Record<string, AnswerValue>; manualOverride: Record<string, boolean> }>({
    values: {},
    manualOverride: {}
  });

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    db.sectionAnswers.get(sectionAnswerKey(caseId, sectionId)).then((row) => {
      if (cancelled) return;
      setValues(row?.values ?? {});
      setManualOverride(row?.manualOverride ?? {});
      latestRef.current = { values: row?.values ?? {}, manualOverride: row?.manualOverride ?? {} };
      setSaveState('saved');
      setLoaded(true);
    });
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [caseId, sectionId]);

  const persist = useCallback(async () => {
    setSaveState('saving');
    await db.sectionAnswers.put({
      key: sectionAnswerKey(caseId, sectionId),
      caseId,
      sectionId,
      values: latestRef.current.values,
      manualOverride: latestRef.current.manualOverride,
      updatedAt: Date.now(),
      updatedBy: getCurrentUser()
    });
    await db.cases.update(caseId, { updatedAt: Date.now(), updatedBy: getCurrentUser(), deviceId: getDeviceId() });
    setSaveState('saved');
  }, [caseId, sectionId]);

  const scheduleSave = useCallback(() => {
    setSaveState('unsaved');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      persist();
    }, AUTOSAVE_DELAY_MS);
  }, [persist]);

  const setValue = useCallback(
    (fieldId: string, value: AnswerValue) => {
      setValues((prev) => {
        const next = { ...prev, [fieldId]: value };
        latestRef.current.values = next;
        return next;
      });
      scheduleSave();
    },
    [scheduleSave]
  );

  const setManual = useCallback(
    (fieldId: string, manual: boolean) => {
      setManualOverride((prev) => {
        const next = { ...prev, [fieldId]: manual };
        latestRef.current.manualOverride = next;
        return next;
      });
      scheduleSave();
    },
    [scheduleSave]
  );

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await persist();
  }, [persist]);

  return { values, manualOverride, saveState, setValue, setManual, saveNow, loaded };
}
