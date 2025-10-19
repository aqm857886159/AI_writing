import React, { createContext, useContext, useMemo } from 'react';
import { getYDoc, onSnapshot, emitSnapshot, onYDocUpdate } from '../services/DocumentService.js';

const DocContext = createContext(null);

export function DocProvider({ children }) {
  const value = useMemo(() => ({
    yDoc: getYDoc(),
    onSnapshot,
    emitSnapshot,
    onYDocUpdate
  }), []);

  return (
    <DocContext.Provider value={value}>{children}</DocContext.Provider>
  );
}

export function useDocContext() {
  const ctx = useContext(DocContext);
  if (!ctx) throw new Error('useDocContext must be used within DocProvider');
  return ctx;
}


