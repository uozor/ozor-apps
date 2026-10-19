export function stamp(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function fileName(kind: string, ext: string, now = new Date()): string {
  return `gwb-${kind}-${stamp(now)}.${ext}`;
}

/** CSV cell with a quote wrap and a guard against spreadsheet formulas. */
export function csvCell(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text) || /^[=+\-@]/.test(text)) {
    const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return text;
}

export function tablesToCsv(tables: string[][][]): string {
  const lines: string[] = [];
  tables.forEach((table, index) => {
    if (tables.length > 1) lines.push(`# Table ${index + 1}`);
    for (const row of table) lines.push(row.map(csvCell).join(','));
  });
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function latin1(text: string): string {
  return String(text ?? '')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2022/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x00-\xff]/g, '?');
}
