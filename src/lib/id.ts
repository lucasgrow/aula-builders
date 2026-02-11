export function genId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
