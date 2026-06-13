import pg from "pg";
import { pool } from "../lib/db";

const { Client } = pg;

async function createDatabaseIfNotExists() {
  const connectionString = process.env.DATABASE_URL;
  let client;

  if (connectionString) {
    try {
      const url = new URL(connectionString);
      url.pathname = "/postgres";
      client = new Client({ connectionString: url.toString() });
    } catch (e) {
      console.warn("⚠️ Could not parse DATABASE_URL to check database existence, trying standard connection parameters.");
    }
  }

  if (!client) {
    client = new Client({
      host: process.env.PGHOST || "localhost",
      port: parseInt(process.env.PGPORT || "5432", 10),
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "postgres",
      database: "postgres",
    });
  }

  try {
    await client.connect();
    console.log("⚙️ Checking if database 'cafe_pos' exists...");
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'cafe_pos'"
    );

    if (checkDb.rowCount === 0) {
      console.log("⚙️ Database 'cafe_pos' does not exist. Creating...");
      await client.query("CREATE DATABASE cafe_pos");
      console.log("✅ Database 'cafe_pos' created successfully.");
    } else {
      console.log("ℹ️ Database 'cafe_pos' already exists.");
    }
  } catch (error) {
    console.warn("⚠️ Note: Could not auto-create database 'cafe_pos' from default 'postgres' database.");
    console.warn("Continuing initialization by trying to connect to 'cafe_pos' directly...");
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}

async function initializeDatabase() {
  await createDatabaseIfNotExists();

  console.log("⚡ Connecting to 'cafe_pos' database...");
  let client;
  try {
    client = await pool.connect();
    console.log("✅ Database connection established successfully.");
  } catch (error) {
    console.error("❌ Failed to connect to the 'cafe_pos' database.");
    console.error("Please ensure PostgreSQL is running and your .env configuration is correct.");
    console.error(error);
    process.exit(1);
  }

  try {
    console.log("⚙️ Creating 'users' table if it does not exist...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ 'users' table is ready.");

    // Seed default data if table is empty
    console.log("🌱 Checking if seeding is required...");
    const result = await client.query("SELECT COUNT(*) FROM users");
    const count = parseInt(result.rows[0].count, 10);

    if (count === 0) {
      console.log("🌱 Table 'users' is empty. Seeding initial users...");
      await client.query(`
        INSERT INTO users (name, email, role) VALUES
        ('Admin User', 'admin@cafe.pos', 'admin'),
        ('Cashier One', 'cashier1@cafe.pos', 'cashier')
      `);
      console.log("✅ Seeded initial users.");
    } else {
      console.log(`ℹ️ Table 'users' already has ${count} records. Seeding skipped.`);
    }

    console.log("🎉 Database initialization completed successfully!");
  } catch (error) {
    console.error("❌ Error running database initialization query:");
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase();
