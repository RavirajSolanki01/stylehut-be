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
): Promise<boolean> => {
  const checks: Promise<boolean>[] = [];
  const trimmedName = name.trim();

  // Helper to build a generic query
  const buildQuery = async (table: ModelName, where: Record<string, any>): Promise<boolean> => {
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
    return !!result;
  };

  const { category_id, sub_category_id, excludeId } = options;

  if (model === "category") {
    checks.push(buildQuery("category", excludeId ? { id: { not: excludeId } } : {}));
    checks.push(buildQuery("sub_category", {}));
    checks.push(buildQuery("sub_category_type", {}));
    checks.push(buildQuery("brand", {}));
  }

  if (model === "sub_category") {
    checks.push(buildQuery("category", {}));
    checks.push(buildQuery("sub_category_type", {}));
    checks.push(
      buildQuery("sub_category", {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        ...(category_id ? { category_id } : {}),
      })
    );
    checks.push(buildQuery("brand", {}));
  }

  if (model === "sub_category_type") {
    checks.push(buildQuery("category", {}));
    checks.push(buildQuery("sub_category", {}));

    if (category_id && sub_category_id) {
      checks.push(
        buildQuery("sub_category_type", {
          ...(excludeId ? { id: { not: excludeId } } : {}),
          category_id,
          sub_category_id: {
            not: sub_category_id,
          },
        })
      );

      checks.push(
        buildQuery("sub_category_type", {
          ...(excludeId ? { id: { not: excludeId } } : {}),
          category_id,
          sub_category_id,
        })
      );
    }
    checks.push(buildQuery("brand", {}));
  }

  if (model === "brand") {
    checks.push(buildQuery("category", {}));
    checks.push(buildQuery("sub_category", {}));
    checks.push(buildQuery("sub_category_type", {}));
    checks.push(buildQuery("brand", excludeId ? { id: { not: excludeId } } : {}));
  }

  const results = await Promise.all(checks);
  return results.some(Boolean);
};
