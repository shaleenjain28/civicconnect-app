import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'prisma/config';

config({ path: resolve(process.cwd(), '.env') });

const fallbackDbUrl = 'postgresql://postgres:postgres@localhost:5432/civicconnect';
const databaseUrl = process.env.DATABASE_URL?.trim() || fallbackDbUrl;
const directUrl = process.env.DIRECT_URL?.trim() || databaseUrl;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Keep prisma generate/build working in CI where DB env vars may be absent.
    url: databaseUrl,
    directUrl,
  },
});

