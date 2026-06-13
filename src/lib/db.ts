import pg from "pg";

const { Pool } = pg;

// Use the DATABASE_URL environment variable if present,
// otherwise fall back to individual connection parameters.
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool(
  connectionString
    ? { connectionString }
    : {
        host: process.env.PGHOST || "localhost",
        port: parseInt(process.env.PGPORT || "5432", 10),
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres",
        database: process.env.PGDATABASE || "cafe_pos",
      }
);

/**
 * A helper function to query the database.
 * Use this for simple, one-off queries where you don't need a client lease.
 */
export const query = (text: string, params?: any[]) => pool.query(text, params);
