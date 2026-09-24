// Money helpers: all arithmetic happens in integer cents to avoid
// floating-point rounding errors (0.1 + 0.2 !== 0.3 in JavaScript).

export function toCents(value: string | number): number {
  const text = typeof value === "number" ? value.toFixed(2) : value;
  return Math.round(parseFloat(text) * 100);
}

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}