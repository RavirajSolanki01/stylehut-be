import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        otp_verified: true
      },
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
