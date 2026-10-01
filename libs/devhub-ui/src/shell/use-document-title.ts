'use client';

import { useEffect } from 'react';

import { useDevHub } from '../provider/devhub-provider';

/** 화면마다 문서 제목을 맞춘다 — 탭 · 방문 기록 · 스크린 리더가 어느 화면인지 안다. */
export const useDocumentTitle = (title: string) => {
  const { productName } = useDevHub();
  useEffect(() => {
    document.title = title === productName ? title : `${title} · ${productName}`;
  }, [title, productName]);
};
