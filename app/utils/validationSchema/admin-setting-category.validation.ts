import { z } from "zod";

// Brand creation schema
export const updateAdminSettingCategorySchema = z.object({
  fontColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: "Font color must be a valid hex color code (e.g., #FFF or #FFFFFF)",
    })
    .trim(),
  cardColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: "Card color must be a valid hex color code (e.g., #FFF or #FFFFFF)",
    })
    .trim(),
});

// Types inferred from schemas
export type UpdateAdminSettingCategoryInput = z.infer<typeof updateAdminSettingCategorySchema>;
