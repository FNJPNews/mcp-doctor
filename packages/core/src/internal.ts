export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const result = value.filter((entry): entry is string => typeof entry === "string");
  return result.length > 0 ? result : [];
}

export function stableServerId(client: string, configPath: string, name: string, index: number): string {
  return `${client}:${configPath}:${name}:${index}`;
}

export function basenameOfCommand(command: string): string {
  const withoutQuotes = command.trim().replace(/^["']|["']$/g, "");
  const segments = withoutQuotes.split(/[\\/]/);
  const base = segments[segments.length - 1] ?? withoutQuotes;
  return base.replace(/\.(exe|cmd|bat|com)$/i, "").toLowerCase();
}

export function uniqueByKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
}
