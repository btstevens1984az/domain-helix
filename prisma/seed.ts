import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PLAYBOOKS } from "../src/lib/demo-data";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.BREAKGLASS_EMAIL ?? process.env.ADMIN_EMAIL ?? "breakglass@domainhelix.local";
  const password =
    process.env.BREAKGLASS_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "ChangeMe-DomainHelix-Breakglass-2026!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name: "Breakglass Admin",
      role: "admin",
      provider: "local",
    },
    create: {
      email,
      name: "Breakglass Admin",
      passwordHash,
      role: "admin",
      provider: "local",
    },
  });

  // Keep legacy demo admin alias if distinct
  const legacyEmail = process.env.ADMIN_EMAIL;
  if (legacyEmail && legacyEmail !== email) {
    const legacyHash = await bcrypt.hash(
      process.env.ADMIN_PASSWORD ?? password,
      12
    );
    await prisma.user.upsert({
      where: { email: legacyEmail },
      update: { passwordHash: legacyHash, role: "admin", provider: "local" },
      create: {
        email: legacyEmail,
        name: "DomainHelix Admin",
        passwordHash: legacyHash,
        role: "admin",
        provider: "local",
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
    } else {
      await prisma.playbook.update({
        where: { id: existing.id },
        data: {
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
  console.log(`Breakglass admin: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
