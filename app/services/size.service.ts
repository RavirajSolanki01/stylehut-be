import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const sizeService = {
  async createSize(
    data: {
      name: string;
      size: string;
      custom_size_id: string;
      type?: string;
      has_size_chart?: boolean;
      is_cm?: boolean;
    },
    tx: Prisma.TransactionClient = prisma // default to normal Prisma client if no transaction passed
  ) {
    const existingSize = await tx.size_data.findFirst({
      where: {
        name: data.name,
        is_deleted: true,
      },
    });

    if (existingSize) {
      return await tx.size_data.update({
        where: { id: existingSize.id },
        data: {
          is_deleted: false,
        },
      });
    }

    return await tx.size_data.create({
      data: {
        name: data.name,
        is_deleted: false,
        size: data.size,
        custom_size_id: data.custom_size_id,
        has_size_chart: data.has_size_chart,
        type: data.type,
        is_cm: data.is_cm,
      },
    });
  },

  // async createSizeChart(data: {
  //   custom_size_id: string;
  //   size_field_name: string;
  //   size_field_value: string;
  // }) {
  //   // const existingSize = await prisma.size_chart_data.findFirst({
  //   //   where: {
  //   //     custom_size_id: data.custom_size_id,
  //   //     // is_deleted: true,
  //   //   },
  //   // });

  //   // if (existingSize) {
  //   //   return await prisma.size_data.update({
  //   //     where: { id: existingSize.id },
  //   //     data: {
  //   //       is_deleted: false,
  //   //     },
  //   //   });
  //   // }

  //   const { ...cleanedData } = data;
  //   return await prisma.size_chart_data.create({
  //     data: {
  //       custom_size_id: cleanedData.custom_size_id,
  //       size_field_name: cleanedData.size_field_name,
  //       size_field_value: cleanedData.size_field_value,
  //     },
  //   });
  // },

  async createSizeChart(
    data: {
      custom_size_id: string;
      size_field_name: string;
      size_field_value: string;
    },
    tx: Prisma.TransactionClient = prisma
  ) {
    return await tx.size_chart_data.create({
      data: {
        custom_size_id: data.custom_size_id,
        size_field_name: data.size_field_name,
        size_field_value: data.size_field_value,
      },
    });
  },

  async createSizesd(size_data: {
    size_data: {
      name: string;
      size: string;
      custom_size_id: string;
      type?: string;
      has_size_chart?: boolean;
      is_cm?: boolean;
    }[];
    size_chart_data: {
      custom_size_id: string;
      size_field_name: string;
      size_field_value: string;
    }[];
  }) {
    const response = await prisma.$transaction(async tx => {
      // Step 1: Create all size_data entries using the transaction client
      for (const data of size_data.size_data) {
        await this.createSize(data, tx);
      }

      // Step 2: Create all size_chart_data entries using the transaction client
      for (const data of size_data.size_chart_data) {
        await this.createSizeChart(data, tx);
      }
    });

    return { message: "Sizes and size chart data created successfully (transactional)", response };
  },

  // -------------------------

  async createSizes(size_data: {
    size_data: {
      name: string;
      size: string;
      custom_size_id: string;
      type?: string;
      has_size_chart?: boolean;
      is_cm?: boolean;
    }[];
    size_chart_data: {
      custom_size_id: string;
      size_field_name: string;
      size_field_value: string;
    }[];
  }) {
    const response = await prisma.$transaction(async tx => {
      // Handle "restore if exists" manually before bulk insert
      const existingSizes = await tx.size_data.findMany({
        where: {
          name: {
            in: size_data.size_data.map(d => d.name),
          },
          is_deleted: true,
        },
      });

      const toRestore = existingSizes.map(size => size.id);

      if (toRestore.length) {
        await tx.size_data.updateMany({
          where: {
            id: { in: toRestore },
          },
          data: { is_deleted: false },
        });
      }

      // Filter out the restored entries to avoid duplicate insert
      const newSizes = size_data.size_data.filter(s => !existingSizes.find(e => e.name === s.name));

      // Bulk insert new size_data
      if (newSizes.length) {
        await tx.size_data.createMany({
          data: newSizes,
          skipDuplicates: true, // ensure no race condition duplicate
        });
      }

      // Bulk insert size_chart_data
      if (size_data.size_chart_data.length) {
        await tx.size_chart_data.createMany({
          data: size_data.size_chart_data,
          skipDuplicates: true, // just in case of retries
        });
      }
    });

    return {
      message: "Sizes and size chart data created successfully (optimized)",
      response,
    };
  },

  //-------------------------

  // async createSizes(
  //   dataList: {
  //     name: string;
  //     size: string;
  //     custom_size_id: string;
  //     type?: string;
  //     has_size_chart?: boolean;
  //   }[]
  // ) {
  //   return await Promise.all(dataList.map(data => this.createSize(data)));
  // },

  async deleteSizes(ids: (string | number)[]) {
    return await prisma.$transaction(async tx => {
      const sizeIds = ids.map(Number);

      // Step 1: Fetch all size_data entries
      const sizes = await tx.size_data.findMany({
        where: {
          id: { in: sizeIds },
        },
      });

      // Separate those that have size_chart and those that don't
      const sizesWithChart = sizes.filter(s => s.has_size_chart);
      const sizesWithoutChart = sizes.filter(s => !s.has_size_chart);

      const customSizeIdsToDelete = sizesWithChart.map(s => s.custom_size_id);
      const sizeIdsToDelete = sizes.map(s => s.id);

      const operations = [];

      // Step 2: Delete related size_chart_data
      if (customSizeIdsToDelete.length > 0) {
        operations.push(
          tx.size_chart_data.deleteMany({
            where: {
              custom_size_id: { in: customSizeIdsToDelete },
            },
          })
        );
      }

      // Step 3: Delete all size_data entries
      if (sizeIdsToDelete.length > 0) {
        operations.push(
          tx.size_data.deleteMany({
            where: {
              id: { in: sizeIdsToDelete },
            },
          })
        );
      }

      await Promise.all(operations); // Execute in parallel inside transaction
    });
  },

  // async deleteSizeChart(id: string | number, tx: Prisma.TransactionClient = prisma) {
  //   const size_data = await tx.size_data.findFirst({
  //     where: {
  //       id: Number(id),
  //     },
  //   });
  //   if (!size_data) {
  //     console.log("Size data not found for id:", id);
  //     return;
  //   }
  //   if (size_data.has_size_chart) {
  //     return await prisma.$transaction([
  //       prisma.size_chart_data.deleteMany({
  //         where: {
  //           custom_size_id: size_data.custom_size_id,
  //         },
  //       }),
  //       prisma.size_data.delete({
  //         where: {
  //           id: Number(id),
  //         },
  //       }),
  //     ]);
  //   } else {
  //     return await prisma.size_data.delete({
  //       where: {
  //         id: Number(id),
  //       },
  //     });
  //   }
  // },

  // async deleteSizes(data: string[] | number[]) {
  //   const response = await prisma.$transaction(async tx => {
  //     for (const id of data) {
  //       await this.deleteSizeChart(id, tx);
  //     }
  //   });
  //   return { message: "Sizes and size chart data deleted successfully (transactional)", response };
  // },

  async getAllSizes() {
    const sizes = await prisma.size_data.findMany({
      where: { is_deleted: false },
    });

    // Fetch size chart data for each size based on custom_size_id
    const sizesWithCharts = await Promise.all(
      sizes.map(async size => {
        const sizeChartData = await prisma.size_chart_data.findMany({
          where: {
            custom_size_id: size.custom_size_id,
          },
        });
        return {
          ...size,
          size_chart_data: sizeChartData,
        };
      })
    );

    return sizesWithCharts;
  },

  async checkSizeNameExists(name: string) {
    // Get all active sizes
    const allSizes = await prisma.size_data.findMany({
      where: { is_deleted: false },
      select: { name: true },
    });

    // Normalize the input name
    const normalizedInput = name.toLowerCase().replace(/[\s-]/g, "");

    // Check for matches
    const matches = allSizes.filter(size => {
      const normalizedSize = size.name.toLowerCase().replace(/[\s-]/g, "");

      // Calculate similarity using Levenshtein distance
      const distance = this.levenshteinDistance(normalizedInput, normalizedSize);
      const maxLength = Math.max(normalizedInput.length, normalizedSize.length);
      const similarity = 1 - distance / maxLength;

      return similarity >= 0.9; // 90% similarity threshold
    });

    return {
      exists: matches.length > 0,
      matches: matches.map(m => m.name), // Return matching names for reference
    };
  },

  async searchSizes(query: string) {
    // Get all active sizes
    const allSizes = await prisma.size_data.findMany({
      where: { is_deleted: false },
      select: { id: true, name: true, size: true },
    });

    // Normalize the search query
    const normalizedQuery = query.toLowerCase().replace(/[\s-]/g, "");

    // Find matches using fuzzy search
    const matches = allSizes.filter(size => {
      const normalizedName = size.name.toLowerCase().replace(/[\s-]/g, "");
      const normalizedSize = size.size.toLowerCase().replace(/[\s-]/g, "");

      // Check if query matches either name or size
      const nameDistance = this.levenshteinDistance(normalizedQuery, normalizedName);
      const sizeDistance = this.levenshteinDistance(normalizedQuery, normalizedSize);

      const nameSimilarity =
        1 - nameDistance / Math.max(normalizedQuery.length, normalizedName.length);
      const sizeSimilarity =
        1 - sizeDistance / Math.max(normalizedQuery.length, normalizedSize.length);

      return nameSimilarity >= 0.8 || sizeSimilarity >= 0.8; // 70% similarity threshold for search
    });

    return {
      results: matches,
      total: matches.length,
    };
  },

  // Levenshtein distance implementation for string similarity
  levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(0)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j - 1] + 1, // substitution
            dp[i - 1][j] + 1, // deletion
            dp[i][j - 1] + 1 // insertion
          );
        }
      }
    }

    return dp[m][n];
  },

  async getSizesById(ids: (string | number)[]) {
    const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id));

    const sizes = await prisma.size_data.findMany({
      where: { is_deleted: false, id: { in: numericIds } },
    });

    return sizes;
  },
};
