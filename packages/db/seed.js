const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Create 'default' user for nutrition generic queries
    await prisma.user.upsert({
      where: { email: 'default@aura.app' },
      update: {},
      create: {
        id: 'default',
        email: 'default@aura.app',
        name: 'Default User',
      }
    });
    console.log('Upserted default user.');

    // Create a strict test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test@aura.app' },
      update: {},
      create: {
        id: 'test_user_123',
        email: 'test@aura.app',
        name: 'Test User',
      }
    });
    console.log('Upserted test user:', testUser.id);
  } catch (e) {
    console.error(e);
  }
}

main().finally(() => prisma.$disconnect());
