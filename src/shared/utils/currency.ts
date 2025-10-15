/**
 * Format a number as currency (KSH)
 */
export const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `KSH ${numAmount.toLocaleString()}`;
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (currencyString: string): number => {
  return parseFloat(currencyString.replace(/[^0-9.-]+/g, ''));
};
