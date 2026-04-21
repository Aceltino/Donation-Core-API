import { PrismaClient, DonationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (optional - comentar se quiser preservar)
  console.log('🧹 Cleaning existing data...');
  await prisma.processedWebhook.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.ngo.deleteMany();
  await prisma.donor.deleteMany();

  // Create NGOs
  console.log('🏢 Creating NGOs...');
  const ngo1 = await prisma.ngo.create({
    data: {
      name: 'Save the Children',
      email: 'contact@savethechildren.org',
      description: 'International organization supporting children in need',
    },
  });

  const ngo2 = await prisma.ngo.create({
    data: {
      name: 'Red Cross',
      email: 'contact@redcross.org',
      description: 'Humanitarian organization providing emergency assistance',
    },
  });

  const ngo3 = await prisma.ngo.create({
    data: {
      name: 'Doctors Without Borders',
      email: 'contact@msf.org',
      description: 'Medical humanitarian organization',
    },
  });

  console.log(`✅ Created ${[ngo1, ngo2, ngo3].length} NGOs`);

  // Create Donors
  console.log('👤 Creating Donors...');
  const donor1 = await prisma.donor.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
  });

  const donor2 = await prisma.donor.create({
    data: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
    },
  });

  const donor3 = await prisma.donor.create({
    data: {
      name: 'Carlos Silva',
      email: 'carlos.silva@example.com',
    },
  });

  console.log(`✅ Created ${[donor1, donor2, donor3].length} Donors`);

  // Create sample Donations (PENDING status for testing checkout)
  console.log('💝 Creating sample Donations...');
  const donation1 = await prisma.donation.create({
    data: {
      amount: 100.0,
      ngoId: ngo1.id,
      donorId: donor1.id,
      status: DonationStatus.PENDING,
    },
  });

  const donation2 = await prisma.donation.create({
    data: {
      amount: 250.0,
      ngoId: ngo2.id,
      donorId: donor2.id,
      status: DonationStatus.PENDING,
    },
  });

  const donation3 = await prisma.donation.create({
    data: {
      amount: 500.0,
      ngoId: ngo3.id,
      donorId: donor3.id,
      status: DonationStatus.PENDING,
    },
  });

  console.log(`✅ Created ${[donation1, donation2, donation3].length} sample Donations`);

  // Print reference data for testing
  console.log('\n📋 Reference Data for Testing:\n');
  console.log('NGOs:');
  console.log(`  - ${ngo1.name} (ID: ${ngo1.id})`);
  console.log(`  - ${ngo2.name} (ID: ${ngo2.id})`);
  console.log(`  - ${ngo3.name} (ID: ${ngo3.id})\n`);

  console.log('Donors:');
  console.log(`  - ${donor1.name} (ID: ${donor1.id})`);
  console.log(`  - ${donor2.name} (ID: ${donor2.id})`);
  console.log(`  - ${donor3.name} (ID: ${donor3.id})\n`);

  console.log('Sample Checkout Request:');
  console.log(`
  {
    "amount": 150,
    "ngoId": "${ngo1.id}",
    "donorId": "${donor1.id}",
    "successUrl": "http://localhost:3000/success",
    "cancelUrl": "http://localhost:3000/cancel"
  }
  `);
}

main()
  .then(async () => {
    console.log('✨ Seed completed successfully!');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
