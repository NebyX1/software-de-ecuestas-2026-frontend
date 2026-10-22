import { z } from 'zod';

const dimension = z.number().int().min(1).max(32768);
const version = z.string().regex(/^[0-9.]{1,32}$/);
const brandSchema = z.object({ brand: z.string().min(1).max(64), version });
const hintsSchema = z.object({
  platform: z.string().max(64).optional(), platformVersion: z.string().regex(/^[0-9.]{0,32}$/).optional(),
  model: z.string().max(128).optional(), mobile: z.boolean().optional(),
  brands: z.array(brandSchema).max(8).optional(), fullVersionList: z.array(brandSchema).max(8).optional(),
});
export const clientMetadataSchema = z.object({
  language: z.string().regex(/^[A-Za-z0-9-]{1,64}$/).optional(),
  timezone: z.string().min(1).max(64).optional(),
  screen: z.object({ width: dimension, height: dimension }).optional(),
  viewport: z.object({ width: dimension, height: dimension }).optional(),
  pixelRatio: z.number().finite().min(0.1).max(16).optional(),
  touchPoints: z.number().int().min(0).max(100).optional(),
  clientHints: hintsSchema.optional(),
});
export type ClientMetadata = z.infer<typeof clientMetadataSchema>;

interface NavigatorHints {
  brands?: unknown;
  mobile?: unknown;
  platform?: unknown;
  getHighEntropyValues?: (hints: string[]) => Promise<unknown>;
}

function optionalValue<T>(schema: z.ZodType<T>, value: unknown): T | undefined {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

// This report is descriptive, not a unique hardware fingerprint. Unsupported,
// denied or slow client hints must never prevent a survey from being submitted.
export async function collectClientMetadata(): Promise<ClientMetadata> {
  const metadata: ClientMetadata = {};
  try {
    metadata.language = optionalValue(clientMetadataSchema.shape.language, navigator.language);
    metadata.timezone = optionalValue(clientMetadataSchema.shape.timezone, Intl.DateTimeFormat().resolvedOptions().timeZone);
    metadata.screen = optionalValue(clientMetadataSchema.shape.screen, { width: window.screen.width, height: window.screen.height });
    metadata.viewport = optionalValue(clientMetadataSchema.shape.viewport, { width: window.innerWidth, height: window.innerHeight });
    metadata.pixelRatio = optionalValue(clientMetadataSchema.shape.pixelRatio, window.devicePixelRatio);
    metadata.touchPoints = optionalValue(clientMetadataSchema.shape.touchPoints, navigator.maxTouchPoints);
  } catch { /* Privacy settings may disable some browser APIs. */ }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const hints = (navigator as Navigator & { userAgentData?: NavigatorHints }).userAgentData;
    if (!hints) return clientMetadataSchema.parse(metadata);
    const low = {
      platform: optionalValue(hintsSchema.shape.platform, hints.platform),
      mobile: optionalValue(hintsSchema.shape.mobile, hints.mobile),
      brands: optionalValue(hintsSchema.shape.brands, hints.brands),
    };
    metadata.clientHints = low;
    if (typeof hints.getHighEntropyValues === 'function') {
      const result = await Promise.race([
        hints.getHighEntropyValues(['model', 'platformVersion', 'fullVersionList']),
        new Promise<undefined>(resolve => { timer = setTimeout(() => resolve(undefined), 500); }),
      ]);
      if (result !== null && typeof result === 'object') {
        const values = result as Record<string, unknown>;
        metadata.clientHints = {
          ...low,
          model: optionalValue(hintsSchema.shape.model, values.model),
          platformVersion: optionalValue(hintsSchema.shape.platformVersion, values.platformVersion),
          fullVersionList: optionalValue(hintsSchema.shape.fullVersionList, values.fullVersionList),
        };
      }
    }
  } catch { /* Retain low-entropy values if high-entropy access is refused. */ }
  finally { if (timer !== undefined) clearTimeout(timer); }
  return clientMetadataSchema.parse(metadata);
}
