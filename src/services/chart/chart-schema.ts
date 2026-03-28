import { z } from 'zod/v4';

const ChartDatumSchema = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.number().finite(),
});

export const ChartSpecSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('bar'),
    title: z.string().trim().min(1).max(80),
    subtitle: z.string().trim().max(120).optional(),
    xLabel: z.string().trim().max(60).optional(),
    yLabel: z.string().trim().max(60).optional(),
    data: z.array(ChartDatumSchema).min(1).max(6),
  }),
  z.object({
    kind: z.literal('pie'),
    title: z.string().trim().min(1).max(80),
    subtitle: z.string().trim().max(120).optional(),
    data: z.array(ChartDatumSchema).min(1).max(6),
  }),
  z.object({
    kind: z.literal('metric'),
    title: z.string().trim().min(1).max(80),
    subtitle: z.string().trim().max(120).optional(),
    value: z.string().trim().min(1).max(40),
    trend: z.enum(['up', 'down', 'flat']).optional(),
    detail: z.string().trim().max(120).optional(),
  }),
]);

export const ChartGenerationResponseSchema = z.object({
  chart: ChartSpecSchema,
  narration: z.string().trim().max(160).optional(),
});
