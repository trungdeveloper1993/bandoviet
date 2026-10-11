import { TravelLocation } from '../types';

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=600';

export const REGIONS = ['Miền Bắc', 'Miền Trung', 'Miền Nam', 'Nước ngoài'] as const;

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/** Strip Vietnamese accents so "da lat" matches "Đà Lạt". */
export function removeVietnameseTones(str: string): string {
  return str
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Lower-cased, accent-free, trimmed text for search comparisons. */
export function normalizeSearch(str: string): string {
  return removeVietnameseTones(str || '').toLowerCase().trim();
}

/** "Vịnh Hạ Long, Quảng Ninh" → { title: "Vịnh Hạ Long", subtitle: "Quảng Ninh" } */
export function splitName(name: string): { title: string; subtitle: string } {
  const parts = name.split(',').map((p) => p.trim()).filter(Boolean);
  return {
    title: parts[0] || name,
    subtitle: parts.slice(1).join(', '),
  };
}

export function createId(prefix = 'loc'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Geo
// ---------------------------------------------------------------------------

/** Great-circle distance in kilometres. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** 0.42 → "420 m", 12.3 → "12 km", 1234 → "1.234 km" */
export function formatKm(km: number): string {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km).toLocaleString('vi-VN')} km`;
}

/** Rough Vietnamese region from coordinates (used when importing data without one). */
export function guessRegion(lat: number, lng: number): string {
  const insideVietnam = lat >= 8 && lat <= 23.6 && lng >= 102 && lng <= 110;
  if (!insideVietnam) return 'Nước ngoài';
  if (lat > 19) return 'Miền Bắc';
  if (lat > 14) return 'Miền Trung';
  return 'Miền Nam';
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** Parse "YYYY-MM-DD" as a local date (avoids the UTC-midnight off-by-one). */
export function parseLocalDate(value?: string): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Whole days from today until the date (negative when in the past). */
export function daysUntil(value?: string): number | null {
  const d = parseLocalDate(value);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function formatDateVi(value?: string): string {
  const d = parseLocalDate(value);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function describeCountdown(days: number): string {
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Ngày mai';
  if (days > 1) return `Còn ${days} ngày`;
  if (days === -1) return 'Hôm qua';
  return `${-days} ngày trước`;
}

// ---------------------------------------------------------------------------
// CSV import / export
// ---------------------------------------------------------------------------

export const CSV_HEADERS = [
  'name', 'region', 'lat', 'lng', 'visited', 'notes', 'plannedDate', 'image', 'id', 'createdAt',
] as const;

function csvEscape(value: unknown): string {
  const s = value === undefined || value === null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/** Serialise the itinerary to CSV (with a BOM so Excel/Numbers keep the accents). */
export function locationsToCSV(locations: TravelLocation[]): string {
  const lines = [
    CSV_HEADERS.join(','),
    ...locations.map((loc) =>
      CSV_HEADERS.map((h) => csvEscape((loc as unknown as Record<string, unknown>)[h])).join(',')
    ),
  ];
  return '﻿' + lines.join('\r\n');
}

/** Minimal RFC-4180 parser (quotes, commas and newlines inside fields). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Turn CSV text back into locations. Throws when the file has no usable rows.
 * Only `name`, `lat` and `lng` are required; everything else gets sensible defaults.
 */
export function locationsFromCSV(text: string): TravelLocation[] {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = parseCSV(clean).filter((r) => r.some((cell) => cell.trim() !== ''));
  if (rows.length < 2) throw new Error('empty');

  const headers = rows[0].map((h) => h.trim());
  const col = (name: string) => headers.indexOf(name);
  if (col('lat') < 0 || col('lng') < 0) throw new Error('missing coordinates');

  const seenIds = new Set<string>();
  const result: TravelLocation[] = [];

  rows.slice(1).forEach((r, i) => {
    const get = (name: string) => {
      const j = col(name);
      return j >= 0 && j < r.length ? r[j].trim() : '';
    };
    const lat = parseFloat(get('lat').replace(',', '.'));
    const lng = parseFloat(get('lng').replace(',', '.'));
    if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;

    let id = get('id');
    if (!id || seenIds.has(id)) id = `csv_${Date.now()}_${i}`;
    seenIds.add(id);

    const visitedRaw = get('visited').toLowerCase();
    result.push({
      id,
      name: get('name') || 'Địa điểm chưa đặt tên',
      region: get('region') || guessRegion(lat, lng),
      image: get('image') || FALLBACK_IMAGE,
      lat,
      lng,
      visited: ['true', '1', 'yes', 'x', 'đã đi', 'da di'].includes(visitedRaw),
      notes: get('notes'),
      plannedDate: get('plannedDate') || undefined,
      createdAt: get('createdAt') || new Date().toISOString(),
    });
  });

  if (result.length === 0) throw new Error('no valid rows');
  return result;
}

/**
 * Merge incoming locations into the current list, skipping ones that already
 * exist (same id, or same name at the same spot). Returns the merged list and
 * how many were actually added.
 */
export function mergeLocations(
  current: TravelLocation[],
  incoming: TravelLocation[]
): { merged: TravelLocation[]; added: number } {
  const key = (l: TravelLocation) =>
    `${normalizeSearch(l.name)}@${l.lat.toFixed(4)},${l.lng.toFixed(4)}`;
  const ids = new Set(current.map((l) => l.id));
  const keys = new Set(current.map(key));
  const additions: TravelLocation[] = [];

  for (const loc of incoming) {
    if (ids.has(loc.id) || keys.has(key(loc))) continue;
    ids.add(loc.id);
    keys.add(key(loc));
    additions.push(loc);
  }
  return { merged: [...additions, ...current], added: additions.length };
}

// ---------------------------------------------------------------------------
// Browser helpers
// ---------------------------------------------------------------------------

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * On phones, open the native share sheet with the file attached so it can be
 * saved straight to Files / iCloud Drive. Falls back to a normal download.
 * Resolves to 'shared' | 'downloaded' | 'cancelled'.
 */
export async function saveFile(
  filename: string,
  content: string,
  mime: string
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  if (isTouch && typeof navigator.share === 'function' && typeof File !== 'undefined') {
    try {
      const file = new File([content], filename, { type: mime });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return 'shared';
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled';
      // Any other failure: fall through to a regular download
    }
  }
  downloadFile(filename, content, mime);
  return 'downloaded';
}

/** Copy text with a fallback for browsers/iframes where the async API is blocked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function isDesktopLayout(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
}
