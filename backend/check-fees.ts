import prisma from './src/config/database';

const TEST_IDS = [
  '559a25b1-f7b8-4210-9bbf-9b098492efaa',
  '47db6751-dc52-40fc-b8e3-489fa06e18b7',
  '6faa3d26-796e-4443-8558-ca5e5d11dffe',
  'c0deae78-312d-4dd2-882b-ac92778448ea',
  'eeb38a9d-ed62-49d1-92e7-a342bc98f970',
  '0b52f155-e4d9-458f-a5b0-8c59cc07a82b',
];

async function main() {
  const deleted = await prisma.fee.deleteMany({ where: { id: { in: TEST_IDS } } });
  console.log('Deleted test fees:', deleted.count);
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
