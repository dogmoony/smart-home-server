const express = require("express");
const router = express.Router();
const db = require("../db"); // Import the database utility file

// Get all devices
router.get("/", async (req, res) => {
  try {
    const devices = await db.query("SELECT * FROM devices");
    res.json(devices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Add a new device
router.post("/", async (req, res) => {
  const { name, type } = req.body;
  try {
    const newDevice = await db.query(
      "INSERT INTO devices (name, type) VALUES ($1, $2) RETURNING *",
      [name, type]
    );
    res.json(newDevice[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
