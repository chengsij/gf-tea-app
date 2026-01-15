import { z } from 'zod';

export const TeaSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  image: z.string(),
  steepTimes: z.array(z.number())
});

export type Tea = z.infer<typeof TeaSchema>;
