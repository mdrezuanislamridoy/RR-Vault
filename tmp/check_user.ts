import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    console.log('User found:', user ? { ...user, password: !!user.password } : 'Not found');
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check with the email the user is likely using
// I'll check a few common ones if I can see them in context or just generic ones
checkUser('mdrezuanislamridoy@gmail.com');
