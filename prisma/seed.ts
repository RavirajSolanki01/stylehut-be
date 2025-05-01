import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const genders = ["Male", "Female"];
  const roles = ["User", "Seller", "Admin"];

  for (const name of genders) {
    await prisma.gender.upsert({
      where: { name: name },
      update: {},
      create: { name },
    });
  }

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name: name },
      update: {},
      create: { name },
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
