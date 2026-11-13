export const LEDGER_TAB_IDS = ['departments', 'complaints', 'map'] as const

export type LedgerTabId = (typeof LEDGER_TAB_IDS)[number]

export function parseLedgerTab(value: string | undefined): LedgerTabId {
  return LEDGER_TAB_IDS.find((id) => id === value) ?? 'departments'
}
