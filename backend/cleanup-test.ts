import prisma from './src/config/database';

async function main() {
  const deleted = await prisma.fee.deleteMany({
    where: {
      OR: [
        { description: { contains: 'Teste honorário' } },
        { description: { contains: 'Verificação' } },
      ],
    },
  });
  console.log('Deleted test fees:', deleted.count);
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
