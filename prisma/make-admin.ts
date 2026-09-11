// একটি অ্যাকাউন্টকে এডমিন বানানোর স্ক্রিপ্ট।
// ব্যবহার: npm run make:admin -- you@example.com

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  if (!email) {
    console.error("ইমেইল দিন: npm run make:admin -- you@example.com");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`${user.email} এখন এডমিন ✅`);
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
