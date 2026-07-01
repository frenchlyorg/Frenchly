// ponytail: ensures skeleton loaders are visible for at least 300ms
export function minDelay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
