// src/hooks/useEditorAutoSave.js
import { useState, useRef, useEffect, useCallback } from 'react';

export function useEditorAutoSave(onSaveCallback, delay = 3000) {
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const timerRef = useRef(null);

  const triggerSave = useCallback((content) => {
    setSaveStatus('editing');
    
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        if (onSaveCallback) {
          await onSaveCallback(content);
        }
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (error) {
        setSaveStatus('idle');
        console.error("Erro ao salvar:", error);
      }
    }, delay);
  }, [onSaveCallback, delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { saveStatus, lastSavedTime, triggerSave };
}