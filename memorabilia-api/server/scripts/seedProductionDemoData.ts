import { disconnectDemoSeed, seedDemoData } from "./seedDemoData";

const confirmationPhrase = "seed-demo-production";

function assertProductionSeedAllowed() {
  const confirmation = process.env.DEMO_SEED_CONFIRM;
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (confirmation !== confirmationPhrase) {
    throw new Error(
      `Refusing to seed production demo data. Set DEMO_SEED_CONFIRM=${confirmationPhrase} for this one run.`,
    );
  }

  if (!databaseUrl.startsWith("postgresql://")) {
    throw new Error(
      "Refusing to seed production demo data. DATABASE_URL must be a PostgreSQL connection string.",
    );
  }

  if (
    databaseUrl.includes("localhost") ||
    databaseUrl.includes("127.0.0.1")
  ) {
    throw new Error(
      "Refusing to seed production demo data against a local database. Use npm run seed:demo for local demo data.",
    );
  }
}

async function main() {
  assertProductionSeedAllowed();

  console.log("Seeding portfolio demo data into the configured hosted database.");
  console.log("This uses only files from demo-data/ and does not read cards.csv.");

  await seedDemoData();
  await disconnectDemoSeed();
}

main().catch(async (error) => {
  console.error("Failed to seed production demo data:", error);
  await disconnectDemoSeed();
  process.exit(1);
});
