const parts = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Kolkata',
})

/** "12 Nov 2026, 14:32 IST". Fixed zone so server and client render identical text. */
export function formatDateTime(iso: string): string {
  const get = Object.fromEntries(parts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]))
  return `${get.day} ${get.month} ${get.year}, ${get.hour}:${get.minute} IST`
}
