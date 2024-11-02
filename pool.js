// Load environment variables
require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.SERVER_PORT || 3000;

// Configure PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Middleware to parse JSON bodies
app.use(express.json());

// Test endpoint to check server status
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Endpoint to fetch data from the database
app.get("/data", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM your_table_name LIMIT 10"); // Replace 'your_table_name' with your actual table name
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching data from the database:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
