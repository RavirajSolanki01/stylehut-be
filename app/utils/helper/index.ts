import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type ModelName = "category" | "sub_category" | "sub_category_type" | "brand";

export const checkNameConflict = async (
  name: string,
  model: ModelName,
  options: {
    category_id?: number;
    sub_category_id?: number;
    excludeId?: number;
  } = {}
): Promise<{ hasSameName: boolean; message?: string }> => {
  const checks: Promise<{ found: boolean; model: string }>[] = [];
  const trimmedName = name.trim();

  // Helper to build a generic query
  const buildQuery = async (
    table: ModelName,
    where: Record<string, any>
  ): Promise<{ found: boolean; model: string }> => {
    try {
      const result = await (prisma[table] as any).findFirst({
        where: {
          name: {
            equals: trimmedName,
            mode: "insensitive",
          },
          is_deleted: false,
          ...where,
        },
      });
      return {
        found: !!result,
        model: table,
      };
    } catch (error) {
      console.error(`Error querying ${table}:`, error);
      return {
        found: false,
        model: table,
      };
    }
  };

  const { category_id, sub_category_id, excludeId } = options;

  if (model === "category") {
    // Check against all categories (except current if excludeId provided)
    checks.push(buildQuery("category", excludeId ? { id: { not: excludeId } } : {}));
    // Also check against other models to prevent duplicate names across different types
    checks.push(buildQuery("sub_category", {}));
    checks.push(buildQuery("sub_category_type", {}));
    checks.push(buildQuery("brand", {}));
  }

  if (model === "sub_category") {
    // Check against all categories (names must be unique across categories)
    checks.push(buildQuery("category", {}));
    // Check against other sub_categories in same category
    checks.push(
      buildQuery("sub_category", {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        ...(category_id ? { category_id } : {}),
      })
    );
    // Check against all sub_category_types and brands
    checks.push(buildQuery("sub_category_type", {}));
    checks.push(buildQuery("brand", {}));
  }

  if (model === "sub_category_type") {
    // Check against all categories and sub_categories
    checks.push(buildQuery("category", {}));
    checks.push(buildQuery("sub_category", {}));
    // Check against other sub_category_types in same sub_category
    checks.push(
      buildQuery("sub_category_type", {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        ...(sub_category_id ? { sub_category_id } : {}),
      })
    );
    // Check against all brands
    checks.push(buildQuery("brand", {}));
  }

  if (model === "brand") {
    // Check against all other models
    checks.push(buildQuery("category", {}));
    checks.push(buildQuery("sub_category", {}));
    checks.push(buildQuery("sub_category_type", {}));
    // Check against other brands (except current if excludeId provided)
    checks.push(buildQuery("brand", excludeId ? { id: { not: excludeId } } : {}));
  }

  const results = await Promise.all(checks);
  const conflict = results.find(res => res.found);
  return {
    hasSameName: !!conflict,
    message: conflict
      ? `Name already exists in ${formatModelName(conflict.model)}. Please choose a different name`
      : undefined,
  };
};

const formatModelName = (model: string): string => {
  return model.split("_").join(" ");
};
