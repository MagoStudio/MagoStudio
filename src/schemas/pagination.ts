import { z } from "zod";

const paginationMetaSchema = z.object({
  page: z.number(),
  per_page: z.number(),
  total: z.number(),
  pages: z.number(),
  has_next: z.boolean(),
  has_prev: z.boolean(),
  next_num: z.number().nullable(),
  prev_num: z.number().nullable()
});

type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    items: z.array(itemSchema),
    pagination: paginationMetaSchema
  });

export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};
