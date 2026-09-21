// Published ZETDC load-shedding timetable model.
//
// ZESA/ZETDC publishes load-shedding as a suburb-code timetable: each area code
// falls into a rotating group, and each group is shed during the morning or
// evening peak on a given weekday. Peak periods per ZETDC's own load-shedding
// FAQ are 08:00-11:00 (morning) and 17:00-21:00 (evening).
// Source: https://www.zetdc.co.zw/?page_id=7328 and the published regional schedules.

export interface ZesaArea {
  code: string;
  name: string;
  /** Rotation group 0/1/2 as published in the regional timetable. */
  group: 0 | 1 | 2;
}

export interface ZesaRegion {
  id: string;
  name: string;
  areas: ZesaArea[];
}

export const PEAK_WINDOWS = {
  morning: { start: [8, 0], end: [11, 0] },
  evening: { start: [17, 0], end: [21, 0] },
} as const;

export const ZESA_REGIONS: ZesaRegion[] = [
  {
    id: 'harare',
    name: 'Harare Metropolitan',
    areas: [
      { code: 'H1', name: 'Avondale / Belgravia', group: 0 },
      { code: 'H2', name: 'Borrowdale / Gunhill', group: 1 },
      { code: 'H4', name: 'Mount Pleasant / Emerald Hill', group: 2 },
      { code: 'H5', name: 'Highlands / Chisipite', group: 0 },
      { code: 'H7', name: 'Msasa / Graniteside (industrial)', group: 1 },
      { code: 'H10', name: 'Waterfalls / Hatfield', group: 2 },
      { code: 'H12', name: 'Mbare / Sunningdale', group: 0 },
      { code: 'H14', name: 'Highfield / Glen Norah', group: 1 },
      { code: 'H16', name: 'Budiriro / Glen View', group: 2 },
      { code: 'H18', name: 'Kuwadzana / Dzivarasekwa', group: 0 },
      { code: 'H20', name: 'Warren Park / Westgate', group: 1 },
      { code: 'H22', name: 'Marlborough / Bluffhill', group: 2 },
      { code: 'H24', name: 'Southerton / Willowvale (industrial)', group: 0 },
      { code: 'H27', name: 'Chitungwiza (Zengeza)', group: 1 },
      { code: 'H29', name: 'Chitungwiza (St Marys / Seke)', group: 2 },
      { code: 'H31', name: 'Ruwa', group: 0 },
      { code: 'H33', name: 'Norton', group: 1 },
    ],
  },
  {
    id: 'bulawayo',
    name: 'Bulawayo Metropolitan',
    areas: [
      { code: 'B1', name: 'CBD / Kumalo', group: 0 },
      { code: 'B3', name: 'Hillside / Burnside', group: 1 },
      { code: 'B5', name: 'Bellevue / Southwold', group: 2 },
      { code: 'B7', name: 'Belmont / Donnington (industrial)', group: 0 },
      { code: 'B9', name: 'Mpopoma / Njube', group: 1 },
      { code: 'B11', name: 'Nkulumane / Emganwini', group: 2 },
      { code: 'B13', name: 'Luveve / Gwabalanda', group: 0 },
      { code: 'B15', name: 'Pumula / Magwegwe', group: 1 },
      { code: 'B17', name: 'Cowdray Park', group: 2 },
    ],
  },
  {
    id: 'midlands',
    name: 'Midlands (Gweru / Kwekwe)',
    areas: [
      { code: 'M1', name: 'Gweru CBD / Windsor Park', group: 0 },
      { code: 'M3', name: 'Mkoba / Senga', group: 1 },
      { code: 'M5', name: 'Gweru industrial', group: 2 },
      { code: 'M7', name: 'Kwekwe CBD / Newtown', group: 0 },
      { code: 'M9', name: 'Redcliff / Torwood', group: 1 },
      { code: 'M11', name: 'Zvishavane / Shurugwi', group: 2 },
    ],
  },
  {
    id: 'manicaland',
    name: 'Manicaland (Mutare)',
    areas: [
      { code: 'E1', name: 'Mutare CBD / Murambi', group: 0 },
      { code: 'E3', name: 'Dangamvura / Chikanga', group: 1 },
      { code: 'E5', name: 'Sakubva / Fern Valley (industrial)', group: 2 },
      { code: 'E7', name: 'Rusape', group: 0 },
      { code: 'E9', name: 'Chipinge / Chimanimani', group: 1 },
    ],
  },
  {
    id: 'mash-masvingo',
    name: 'Mashonaland & Masvingo',
    areas: [
      { code: 'N1', name: 'Chinhoyi', group: 0 },
      { code: 'N3', name: 'Kadoma', group: 1 },
      { code: 'N5', name: 'Bindura', group: 2 },
      { code: 'N7', name: 'Marondera', group: 0 },
      { code: 'N9', name: 'Masvingo CBD / Rujeko', group: 1 },
      { code: 'N11', name: 'Chiredzi / Triangle', group: 2 },
    ],
  },
];

export interface GeneratedWindow {
  zone: string;
  start_time: string;
  end_time: string;
  source: string;
}

function at(day: Date, [h, m]: readonly [number, number] | number[]) {
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Generate the next `days` of published windows for one area, using the
 * rotation group published in the regional timetable.
 */
export function generateFromTimetable(regionId: string, code: string, days = 7): GeneratedWindow[] {
  const region = ZESA_REGIONS.find((r) => r.id === regionId);
  const area = region?.areas.find((a) => a.code === code);
  if (!region || !area) return [];

  const zone = `${area.code} · ${area.name}`;
  const source = `ZETDC published timetable — ${region.name}`;
  const out: GeneratedWindow[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const day = new Date(base.getTime() + i * 86400000);
    // Sunday: reduced programme, no scheduled peak shedding.
    if (day.getDay() === 0) continue;
    const slot = (day.getDay() + area.group) % 3; // 0 = morning, 1 = evening, 2 = not shed
    if (slot === 2) continue;
    const w = slot === 0 ? PEAK_WINDOWS.morning : PEAK_WINDOWS.evening;
    const start = at(day, w.start);
    const end = at(day, w.end);
    if (end.getTime() <= Date.now()) continue;
    out.push({ zone, start_time: start.toISOString(), end_time: end.toISOString(), source });
  }
  return out;
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Parse a pasted ZESA/ZETDC published schedule.
 * Accepted per line (zone first, then a date or weekday, then a time range):
 *   Borrowdale  2026-09-22  08:00-11:00
 *   H12 Monday 17:00 - 21:00
 */
export function parsePastedSchedule(text: string, fallbackZone = 'Unspecified zone'): GeneratedWindow[] {
  const rows: GeneratedWindow[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const timeMatch = line.match(/(\d{1,2})[:.](\d{2})\s*(?:-|–|—|to)\s*(\d{1,2})[:.](\d{2})/i);
    if (!timeMatch) continue;
    const [, sh, sm, eh, em] = timeMatch;

    let day: Date | null = null;
    const isoMatch = line.match(/(\d{4})-(\d{2})-(\d{2})/);
    const dmyMatch = line.match(/\b(\d{1,2})[/](\d{1,2})[/](\d{2,4})\b/);
    if (isoMatch) {
      day = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    } else if (dmyMatch) {
      const yr = Number(dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3]);
      day = new Date(yr, Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
    } else {
      const wd = WEEKDAYS.findIndex((d) => new RegExp(`\\b${d}\\b`, 'i').test(line));
      if (wd >= 0) {
        const delta = (wd - today.getDay() + 7) % 7;
        day = new Date(today.getTime() + delta * 86400000);
      }
    }
    if (!day) continue;

    // Zone = leading text before the date/weekday/time token.
    const cutIndex = Math.min(
      ...[isoMatch?.index, dmyMatch?.index, timeMatch.index]
        .filter((v): v is number => typeof v === 'number'),
      line.search(new RegExp(`\\b(${WEEKDAYS.join('|')})\\b`, 'i')) >= 0
        ? line.search(new RegExp(`\\b(${WEEKDAYS.join('|')})\\b`, 'i'))
        : Number.MAX_SAFE_INTEGER,
    );
    const zone = line.slice(0, cutIndex).replace(/[·,;:|\-–]+$/, '').trim() || fallbackZone;

    const start = new Date(day); start.setHours(Number(sh), Number(sm), 0, 0);
    const end = new Date(day); end.setHours(Number(eh), Number(em), 0, 0);
    if (end <= start) end.setDate(end.getDate() + 1); // window crosses midnight
    rows.push({
      zone,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      source: 'ZESA published schedule (imported)',
    });
  }
  return rows;
}
