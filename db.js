const { Client } = require("pg");
const client = new Client({
  user: "admin_db",
  host: "terraform-20241030090116966000000003.czyeiy2yipmy.eu-west-2.rds.amazonaws.com",
  database: "mydatabase",
  password: "my_secret_password",
  port: 5432,
  ssl: { rejectUnauthorized: false }, // use `true` if you need strict SSL verification
});

// Test the connection
client.connect((err) => {
  if (err) {
    console.error("Database connection error:", err.stack);
  } else {
    console.log("Connected to RDS PostgreSQL database.");
  }
});

module.exports = client;
