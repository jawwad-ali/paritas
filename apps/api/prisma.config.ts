import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Migrations need a direct connection (they take a session lock that a
    // transaction-mode pooler cannot hold). Hosts with a pooler (Neon on Vercel)
    // set DATABASE_URL_UNPOOLED; locally DATABASE_URL is already direct.
    url: process.env['DATABASE_URL_UNPOOLED'] ?? process.env['DATABASE_URL'],
  },
});
