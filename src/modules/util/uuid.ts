export type UuidOptions = {
  count: number;
  nil: boolean;
  hyphens: boolean;
  uppercase: boolean;
};

export function formatUuid(id: string, options: Pick<UuidOptions, 'hyphens' | 'uppercase'>): string {
  let value = options.hyphens ? id : id.replace(/-/g, '');
  return options.uppercase ? value.toUpperCase() : value.toLowerCase();
}

export function generateUuids(options: UuidOptions): string[] {
  const count = Math.min(100, Math.max(1, Math.floor(options.count) || 1));
  const list: string[] = [];

  for (let i = 0; i < count; i++) {
    const raw = options.nil ? '00000000-0000-0000-0000-000000000000' : crypto.randomUUID();
    list.push(formatUuid(raw, options));
  }

  return list;
}
