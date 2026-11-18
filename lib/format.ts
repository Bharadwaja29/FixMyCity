const parts = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Kolkata',
})

const kolkataDateParts = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

const kolkataIsoParts = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Kolkata',
})

/** "12 Nov 2026, 14:32 IST". Fixed zone so server and client render identical text. */
export function formatDateTime(iso: string): string {
  const get = Object.fromEntries(parts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]))
  return `${get.day} ${get.month} ${get.year}, ${get.hour}:${get.minute} IST`
}

/**
 * Format date in Asia/Kolkata timezone as "18 Nov 2026".
 * Handles ISO strings ("2026-11-17T22:26:00Z"), YYYY-MM-DD ("2026-11-18"), Date objects, and epoch ms.
 */
export function formatKolkataDate(input?: string | Date | number | null): string {
  if (!input) return ''
  let date: Date
  if (typeof input === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      // Midday in IST (+05:30) to preserve the exact day
      date = new Date(`${input}T12:00:00+05:30`)
    } else {
      date = new Date(input)
    }
  } else {
    date = new Date(input)
  }
  if (isNaN(date.getTime())) return String(input)
  return kolkataDateParts.format(date)
}

/**
 * Returns "YYYY-MM-DD" in Asia/Kolkata timezone.
 * For example, 2026-11-17T22:26:00.000Z (which is 03:56 IST on 18 Nov) returns "2026-11-18".
 */
export function toKolkataDateString(input?: string | Date | number | null): string {
  if (!input) return ''
  let date: Date
  if (typeof input === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      date = new Date(`${input}T12:00:00+05:30`)
    } else {
      date = new Date(input)
    }
  } else {
    date = new Date(input)
  }
  if (isNaN(date.getTime())) return ''
  return kolkataIsoParts.format(date)
}
