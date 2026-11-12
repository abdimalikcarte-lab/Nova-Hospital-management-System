
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Configure your PostgreSQL connection string."
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Neon PostgreSQL requires SSL for hosted connections.
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : false,

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("connect", () => {
  console.log("PostgreSQL connection established.");
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

// Execute a SQL query.
export async function query(text, params = []) {
  return pool.query(text, params);
}

// Export the pool for transactions and bootstrap scripts.
export default pool;

