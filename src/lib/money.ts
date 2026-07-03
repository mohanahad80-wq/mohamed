export function formatMoney(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const COMMISSION_RATE = 0.08;
