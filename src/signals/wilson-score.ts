/**
 * Wilson Score lower bound — statistically sound confidence interval for win rates.
 * Penalizes small sample sizes (wide confidence intervals).
 *
 * @param wins - Number of wins
 * @param total - Total number of trades
 * @param z - Z-score (1.64=90%, 1.80, 1.96=95%, 2.33=99%)
 * @returns Lower bound of confidence interval (0-1)
 */
export function wilsonScore(wins: number, total: number, z: number = 1.96): number {
  if (total === 0) return 0;
  const p = wins / total;
  const denominator = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return Math.max(0, (centre - spread) / denominator);
}
