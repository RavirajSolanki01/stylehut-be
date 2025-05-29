import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedBrandSubCategory() {
  try {
    console.log("🌱 Starting Brand-SubCategory seeding process...");

    // Step 1: Check if brands exist in the database
    const brands = await prisma.brand.findMany({
      where: {
        is_deleted: false,
      },
    });

    if (brands.length === 0) {
      console.log("❌ No brands found in database. Skipping brand_sub_category seeding.");
      return;
    }

    console.log(`✅ Found ${brands.length} brands in database`);

    // Step 2: Check if sub_categories exist in the database
    const subCategories = await prisma.sub_category.findMany({
      where: {
        is_deleted: false,
      },
    });

    if (subCategories.length === 0) {
      console.log("❌ No sub_categories found in database. Skipping brand_sub_category seeding.");
      return;
    }

    console.log(`✅ Found ${subCategories.length} sub_categories in database`);

    // Step 3: Both tables have data, proceed with associations
    console.log("🔗 Both brands and sub_categories exist. Creating associations...");

    // Check existing associations to avoid duplicates
    const existingAssociations = await prisma.brand_sub_category.findMany();
    const existingPairs = new Set(
      existingAssociations.map(assoc => `${assoc.brand_id}-${assoc.sub_category_id}`)
    );

    const associationsToCreate = [];

    // Create association data for each brand with all sub_categories
    for (const brand of brands) {
      for (const subCategory of subCategories) {
        const pairKey = `${brand.id}-${subCategory.id}`;

        // Only add if association doesn't already exist
        if (!existingPairs.has(pairKey)) {
          associationsToCreate.push({
            brand_id: brand.id,
            sub_category_id: subCategory.id,
          });
        }
      }
    }

    if (associationsToCreate.length === 0) {
      console.log("ℹ️ All brand-subcategory associations already exist. No new data to seed.");
      return;
    }

    // Step 4: Bulk create associations
    const result = await prisma.brand_sub_category.createMany({
      data: associationsToCreate,
      skipDuplicates: true, // Extra safety against duplicates
    });

    console.log(`🎉 Successfully created ${result.count} brand-subcategory associations!`);

    // Display summary
    console.log("\n📊 Seeding Summary:");
    console.log(`   • Brands processed: ${brands.length}`);
    console.log(`   • Sub-categories processed: ${subCategories.length}`);
    console.log(`   • New associations created: ${result.count}`);
    console.log(`   • Total possible associations: ${brands.length * subCategories.length}`);
  } catch (error) {
    console.error("❌ Error during brand_sub_category seeding:", error);
    throw error;
  }
}

async function main() {
  const genders = ["Male", "Female"];
  const roles = ["User", "Admin", "SuperAdmin"];

  // Create genders
  for (const name of genders) {
    await prisma.gender.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Create roles
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Get SuperAdmin role
  const superAdminRole = await prisma.role.findUnique({
    where: { name: "SuperAdmin" },
  });

  // Create super-admin user
  if (superAdminRole) {
    await prisma.users.upsert({
      where: { email: "superadmin@stylehut.com" },
      update: {},
      create: {
        email: "superadmin@stylehut.com",
        first_name: "Super",
        last_name: "Admin",
        role_id: superAdminRole.id,
        is_approved: true,
        otp_verified: true,
      },
    });
  }

  // Create admin settings category
  await prisma.admin_settings_category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      cardColor: "#d3e2fe",
      fontColor: "#004300",
    },
  });

  await seedBrandSubCategory();
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
