import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const taskData = [
  {
    category: 'Home',
    tasks: [
      { name: 'House Cleaning', description: 'Keep your home fresh and tidy' },
      { name: 'Deep Cleaning', description: 'Thorough cleaning for every corner of your home' },
      { name: 'Laundry Pickup', description: 'Convenient laundry pickup and delivery' },
      { name: 'Home Maintenance', description: 'Get help with household repairs and maintenance' },
      { name: 'Pest Control', description: 'Professional pest control services for your home' },
    ],
  },
  {
    category: 'Errands',
    tasks: [
      { name: 'Grocery Shopping', description: 'Fresh groceries delivered to your doorstep' },
      { name: 'Medicine Pickup', description: 'Quick and reliable medicine pickup' },
      { name: 'Courier Pickup', description: 'Hassle-free courier and package pickup' },
      { name: 'Document Delivery', description: 'Safe and timely document delivery' },
      { name: 'Returns & Exchanges', description: 'Easy product returns and exchanges' },
    ],
  },
  {
    category: 'Lifestyle',
    tasks: [
      { name: 'Restaurant Reservations', description: 'Book the best tables at top restaurants' },
      { name: 'Event Booking', description: 'Find and book events and experiences' },
      { name: 'Gift Shopping', description: 'Thoughtful gift selection and delivery' },
      { name: 'Personal Shopping', description: 'Your own personal shopper for any need' },
      { name: 'Fitness Class Booking', description: 'Book fitness classes and gym sessions' },
    ],
  },
  {
    category: 'Travel',
    tasks: [
      { name: 'Cab Booking', description: 'Reliable cab booking for any destination' },
      { name: 'Hotel Research', description: 'Find the perfect hotel for your trip' },
      { name: 'Airport Transfer', description: 'Smooth airport pickup and drop-off' },
      { name: 'Travel Itinerary Planning', description: 'Custom travel plans tailored to you' },
      { name: 'Local Activity Booking', description: 'Discover and book local activities' },
    ],
  },
  {
    category: 'Personal',
    tasks: [
      { name: 'Appointment Scheduling', description: 'Schedule and manage your appointments' },
      { name: 'Car Servicing', description: 'Regular car maintenance and servicing' },
      { name: 'Pet Care', description: 'Trusted care for your furry friends' },
      { name: 'Birthday Planning', description: 'Plan memorable birthday celebrations' },
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  for (const categoryData of taskData) {
    const category = await prisma.category.upsert({
      where: { name: categoryData.category },
      update: {},
      create: { name: categoryData.category },
    });

    for (const task of categoryData.tasks) {
      const existingTask = await prisma.task.findFirst({
        where: { name: task.name, categoryId: category.id },
      });

      if (existingTask) {
        await prisma.task.update({
          where: { id: existingTask.id },
          data: { description: task.description },
        });
      } else {
        await prisma.task.create({
          data: {
            name: task.name,
            description: task.description,
            categoryId: category.id,
          },
        });
      }
    }

    console.log(`Created category: ${categoryData.category} with ${categoryData.tasks.length} tasks`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
