export function formatUsd(value: number, options?: { maximumFractionDigits?: number }): string {
  const max = options?.maximumFractionDigits ?? 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: max,
    minimumFractionDigits: 0,
  }).format(value);
}

/** USD with explicit +/− for portfolio impact lines (Unicode minus for losses). */
export function formatSignedUsd(
  value: number,
  options?: { maximumFractionDigits?: number }
): string {
  const max = options?.maximumFractionDigits ?? 0;
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: max,
    minimumFractionDigits: 0,
  }).format(abs);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}


export function parsePortfolioValueInput(raw: string): number {
  const n = Number(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function formatPortfolioInputDisplay(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return formatUsd(value, { maximumFractionDigits: 0 });
}
