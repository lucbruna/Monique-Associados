import prisma from './src/config/database';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  console.log('USERS:', JSON.stringify(users, null, 2));
  const cases = await prisma.case.findMany({
    select: { id: true, caseNumber: true, title: true },
    take: 3,
  });
  console.log('CASES:', JSON.stringify(cases, null, 2));
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
