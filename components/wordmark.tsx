import Link from 'next/link'

export function PinCheckMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 30" className={className} aria-hidden="true" fill="none">
      <path
        d="M12 1.5C6.2 1.5 1.5 6.1 1.5 11.8c0 7.4 8.6 15.1 9.8 16.2a1 1 0 0 0 1.4 0c1.2-1.1 9.8-8.8 9.8-16.2C22.5 6.1 17.8 1.5 12 1.5Z"
        fill="currentColor"
      />
      <path
        d="m7.4 12.1 3.2 3.2 6-6.3"
        stroke="var(--saffron)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Wordmark() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-sm text-foreground"
      aria-label="FixMyCity home"
    >
      <PinCheckMark className="h-7 w-auto" />
      <span className="font-serif text-xl font-semibold tracking-tight">
        FixMy<span className="font-normal">City</span>
      </span>
    </Link>
  )
}
