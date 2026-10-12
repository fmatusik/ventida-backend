/**
 * Nadaje (lub odbiera) rolę administratora istniejącemu użytkownikowi.
 *
 *   npm run make-admin -- jan@example.com          # nadaj ADMIN
 *   npm run make-admin -- jan@example.com --revoke # odbierz ADMIN
 */
import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';

async function main() {
  const [email, flag] = process.argv.slice(2);
  if (!email) {
    console.error('Użycie: npm run make-admin -- <email> [--revoke]');
    process.exit(1);
  }
  const prisma = new PrismaClient();
  try {
    const role = flag === '--revoke' ? Role.USER : Role.ADMIN;
    const user = await prisma.user.update({
      where: { email: email.trim().toLowerCase() },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    console.log(`OK: ${user.email} (id ${user.id}) ma teraz rolę ${user.role}`);
  } catch {
    console.error(`Nie znaleziono użytkownika: ${email}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
