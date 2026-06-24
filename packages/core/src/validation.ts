import { z } from "zod";

export const transportSchema = z.enum(["stdio", "http", "sse", "unknown"]);

export const rawServerSchema = z
  .object({
    name: z.string().optional(),
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    env: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
    url: z.string().optional(),
    transport: transportSchema.optional(),
    disabled: z.boolean().optional(),
  })
  .passthrough();

export type RawServerConfig = z.infer<typeof rawServerSchema>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRawServer(value: unknown): ValidationResult {
  const result = rawServerSchema.safeParse(value);
  if (result.success) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: result.error.issues.map((issue) => issue.message),
  };
}
