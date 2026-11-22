/**
 * Idempotent bootstrap data for local development and demos:
 *   - the two transaction sources (Stripe, internal ledger)
 *   - default matching rules
 *   - one demo user per role
 *
 * Safe to run repeatedly: existing rows are left untouched (a demo user's
 * password is never reset by re-seeding). Run with `pnpm db:seed`.
 */
import 'dotenv/config';
import { hash } from '@node-rs/argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SourceKind, UserRole } from '../src/generated/prisma/client.js';
import { ARGON2_OPTIONS } from '../src/modules/auth/password/password.constants.js';

const SOURCES = [
  { code: 'stripe', name: 'Stripe', kind: SourceKind.PAYMENT_GATEWAY },
  { code: 'internal_ledger', name: 'Internal Ledger', kind: SourceKind.INTERNAL_LEDGER },
] as const;

/**
 * Defaults tuned for card payments through Stripe (2.9% + 30¢ fees):
 * a 3% + 50¢ amount tolerance absorbs fees, and both sides of a payment are
 * normally recorded within minutes of each other.
 * Candidate threshold 0.65: a pair whose customers are known *and different*
 * scores at most 0.70, so it is proposed for review only when amount and time
 * agree almost perfectly; weaker coincidences are not worth a person's time.
 */
const DEFAULT_MATCHING_CONFIG = {
  amountToleranceMinor: 50,
  amountToleranceBps: 300,
  timeWindowMinutes: 120,
  autoMatchThreshold: 0.85,
  candidateThreshold: 0.65,
  missingAfterMinutes: 60,
} as const;

const DEMO_USERS = [
  { email: 'admin@paritas.example.com', name: 'Jordan Ellis', role: UserRole.ADMIN },
  { email: 'manager@paritas.example.com', name: 'Priya Raman', role: UserRole.MANAGER },
  { email: 'officer@paritas.example.com', name: 'Marcus Chen', role: UserRole.OFFICER },
] as const;

const MIN_DEMO_PASSWORD_LENGTH = 12;

const readDemoPassword = (): string => {
  const password = process.env['SEED_DEMO_PASSWORD'];
  if (!password || password.length < MIN_DEMO_PASSWORD_LENGTH) {
    throw new Error(
      `SEED_DEMO_PASSWORD must be set and at least ${MIN_DEMO_PASSWORD_LENGTH} characters.`,
    );
  }
  return password;
};

const readDatabaseUrl = (): string => {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL must be set.');
  }
  return url;
};

const seedSources = async (prisma: PrismaClient): Promise<void> => {
  for (const source of SOURCES) {
    await prisma.source.upsert({ where: { code: source.code }, update: {}, create: source });
  }
  console.info(`✔ sources: ${SOURCES.map((source) => source.code).join(', ')}`);
};

const seedMatchingConfig = async (prisma: PrismaClient): Promise<void> => {
  await prisma.matchingConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, ...DEFAULT_MATCHING_CONFIG },
  });
  console.info('✔ matching config');
};

const seedDemoUsers = async (prisma: PrismaClient, password: string): Promise<void> => {
  const passwordHash = await hash(password, ARGON2_OPTIONS);
  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash },
    });
  }
  console.info(`✔ demo users: ${DEMO_USERS.map((user) => user.email).join(', ')}`);
};

const main = async (): Promise<void> => {
  const password = readDemoPassword();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: readDatabaseUrl() }),
  });
  try {
    await seedSources(prisma);
    await seedMatchingConfig(prisma);
    await seedDemoUsers(prisma, password);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
