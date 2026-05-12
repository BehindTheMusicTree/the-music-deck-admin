import { defineConfig } from 'prisma/config';
import { loadEnvFile } from 'node:process';

try { loadEnvFile('.env'); } catch { /* no .env — rely on process env (CI/staging) */ }

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
