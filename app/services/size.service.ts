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
    tx: Prisma.TransactionClient = prisma// default to normal Prisma client if no transaction passed
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
};
