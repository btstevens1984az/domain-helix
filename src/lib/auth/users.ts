import { prisma } from "@/lib/prisma";

export async function upsertFederatedUser(input: {
  email: string;
  name: string;
  role: string;
  provider: string;
  groups?: string[];
}) {
  const email = input.email.toLowerCase();
  return prisma.user.upsert({
    where: { email },
    update: {
      name: input.name,
      role: input.role,
      provider: input.provider,
      groups: JSON.stringify(input.groups ?? []),
    },
    create: {
      email,
      name: input.name,
      role: input.role,
      provider: input.provider,
      groups: JSON.stringify(input.groups ?? []),
    },
  });
}
