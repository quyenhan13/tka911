import type React from 'react';

export const fallbackPoster = 'https://placehold.co/300x450/0b0f17/64748b?text=VTeen';

const extractDriveId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get('id');
    if (fromQuery) return fromQuery;

    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch?.[1]) return fileMatch[1];

    const vteenFileMatch = url.pathname.match(/\/f\/([^/?#]+)/);
    if (vteenFileMatch?.[1]) return vteenFileMatch[1];
  } catch {
    const vteenFileMatch = trimmed.match(/\/f\/([^/?#]+)/);
    if (vteenFileMatch?.[1]) return vteenFileMatch[1];
  }

  return '';
};

export const getPosterSrc = (value?: string) => value?.trim() || fallbackPoster;

export const getPosterFallback = (value?: string) => {
  const driveId = value ? extractDriveId(value) : '';
  return driveId ? `https://lh3.googleusercontent.com/d/${driveId}=w500` : fallbackPoster;
};

export const handlePosterError = (event: React.SyntheticEvent<HTMLImageElement>, originalSrc?: string) => {
  const img = event.currentTarget;
  const fallbackSrc = getPosterFallback(originalSrc);

  if (img.src !== fallbackSrc) {
    img.src = fallbackSrc;
    return;
  }

  if (img.src !== fallbackPoster) {
    img.src = fallbackPoster;
  }
};
