export default {
  schema: './lib/db/src/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
