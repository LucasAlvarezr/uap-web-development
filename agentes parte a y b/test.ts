
// Entrada de datos iniciales. Este es el usuario que se maneja con usuarioID: 1

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: { externalId: "user123" },
  });

  const entry = await prisma.readingEntry.create({
    data: {
      userId: user.id,
      bookId: "book456",
      status: "to_read",
      priority: "high",
      notes: "Quiero leerlo pronto",
    },
  });

  const usersWithEntries = await prisma.user.findMany({
    include: { readingEntries: true },
  });

  console.log({ user, entry, usersWithEntries });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
