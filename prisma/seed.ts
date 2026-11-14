import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PLAYBOOKS } from "../src/lib/demo-data";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD ?? "DomainHelix!Admin",
    10
  );

  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? "admin@domainhelix.local" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL ?? "admin@domainhelix.local",
      name: "DomainHelix Admin",
      passwordHash,
      role: "admin",
      provider: "local",
    },
  });

  const connectorTypes = [
    "ad",
    "entra",
    "crowdstrike",
    "dynatrace",
    "bigfix",
    "vmware",
    "servicenow",
    "splunk",
  ];

  for (const type of connectorTypes) {
    await prisma.connectorConfig.upsert({
      where: { type },
      update: {},
      create: {
        type,
        enabled: !["servicenow", "splunk"].includes(type),
        mockMode: true,
        status: ["servicenow", "splunk"].includes(type) ? "idle" : "healthy",
        message: "Seeded in mock mode",
      },
    });
  }

  for (const pb of DEMO_PLAYBOOKS) {
    const existing = await prisma.playbook.findFirst({ where: { name: pb.name } });
    if (!existing) {
      await prisma.playbook.create({
        data: {
          id: pb.id,
          name: pb.name,
          description: pb.description,
          category: pb.category,
          platform: pb.platform,
          riskLevel: pb.riskLevel,
          script: pb.script,
          requiresApproval: pb.requiresApproval,
        },
      });
    }
  }

  console.log("DomainHelix demo database seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
