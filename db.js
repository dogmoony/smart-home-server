const fs = require("fs");
const { Pool } = require("pg");

const pool = new Pool({
  host: "terraform-20241030090116966000000003.czyeiy2yipmy.eu-west-2.rds.amazonaws.com", // RDS Endpoint
  port: 5432,
  user: "admin_db", // Master username
  password: "my_secret_password", // Password
  database: "mydatabase", // Database name
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("../eu-west-2-bundle.pem").toString(),
  },
});

// Query function for handling database queries
async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

module.exports = { query };
