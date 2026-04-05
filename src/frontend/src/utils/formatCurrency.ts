/**
 * Format a number as Indian Rupee with Indian number formatting.
 * Example: 14500 → ₹14,500
 */
export function formatINR(amount: number): string {
  return `₹${new Intl.NumberFormat("en-IN").format(Math.round(amount))}`;
}
