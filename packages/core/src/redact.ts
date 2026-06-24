import { isRecord } from "./internal.js";

export const REDACTED = "[REDACTED]";

const SENSITIVE_KEY_PATTERN = /(TOKEN|KEY|SECRET|PASSWORD|AUTH|PRIVATE|CREDENTIAL)/i;

const PRIVATE_KEY_PATTERN =
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const NAMED_SECRET_PATTERN =
  /\b(api[_-]?key|token|password|secret|credential|private[_-]?key)\s*[:=]\s*["']?([^\s"',;]+)/gi;
const TOKEN_LIKE_PATTERN =
  /\b(?:sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9_]{16,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|[A-Za-z0-9_./+=-]{48,})\b/g;

const SECRET_DETECTION_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/,
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/i,
  /\b(api[_-]?key|token|password|secret|credential|private[_-]?key)\s*[:=]\s*["']?([^\s"',;]+)/i,
  /\b(?:sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9_]{16,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|[A-Za-z0-9_./+=-]{48,})\b/,
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

export function looksLikeSecretString(value: string): boolean {
  return SECRET_DETECTION_PATTERNS.some((pattern) => pattern.test(value));
}

export function redactString(value: string): string {
  return value
    .replace(PRIVATE_KEY_PATTERN, REDACTED)
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .replace(NAMED_SECRET_PATTERN, (_match, name: string) => `${name}=${REDACTED}`)
    .replace(TOKEN_LIKE_PATTERN, REDACTED);
}

export function redactSecrets(value: unknown, keyHint?: string): unknown {
  if (keyHint && isSensitiveKey(keyHint)) {
    if (value === null || value === undefined || value === "") {
      return value;
    }
    return REDACTED;
  }

  if (typeof value === "string") {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactSecrets(entry));
  }

  if (isRecord(value)) {
    const result: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of Object.entries(value)) {
      result[entryKey] = redactSecrets(entryValue, entryKey);
    }
    return result;
  }

  return value;
}
