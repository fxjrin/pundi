// RFC4180-style CSV encoding. Caller prepends a UTF-8 byte order mark to the final
// response body so the file opens with correct characters (Rupiah symbols, accents) in Excel.

function escapeField(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export interface CsvColumn<T> {
  header: string
  value: (row: T) => unknown
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeField(column.header)).join(',')
  const lines = rows.map((row) => columns.map((column) => escapeField(column.value(row))).join(','))
  return [header, ...lines].join('\r\n')
}
