import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cardsToGrade = await prisma.card.findMany({
    where: {
      gradingRecommendation: "YES",
    },
    orderBy: {
      gradingProfitPotential: "desc",
    },
    take: 10,
  });

  console.log("🔥 Cards worth grading:\n");
  console.log(cardsToGrade);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
