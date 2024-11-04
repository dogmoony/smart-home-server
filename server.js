require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
const pool = require("./pool");
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("./client/public"));
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

// Listen on specified PORT
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

// Create account endpoint
app.post("/auth/create", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING home_id, username, email;
    `;
    const result = await pool.query(query, [username, email, hashedPassword]);
    res
      .status(201)
      .json({ message: "Account created successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Error creating account:", error);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ message: "Username or email already in use." });
    } else if (error.code === "23503") {
      return res.status(400).json({ message: "Invalid data reference." });
    } else {
      return res.status(500).json({ message: "An unexpected error occurred." });
    }
  }
});

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Login Endpoint
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.userId = user.home_id;
      req.session.username = user.username;

      res
        .status(200)
        .json({ message: "Login successful", redirectUrl: "/main-page.html" });
    } else {
      res.status(401).json({ message: "Invalid email or password." });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An unexpected error occurred." });
  }
});

// Logout Endpoint
app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not log out." });
    }
    res
      .status(200)
      .json({ message: "Logged out successfully", redirectUrl: "/login.html" });
  });
});

// Main Page Endpoint (Protected Route)
app.get("/main", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "client", "public", "main-page.html"));
});

app.get("/api/devices", async (req, res) => {
  const homeId = req.session.userId; // Assuming user’s home ID is stored in session

  try {
    // Query the database for devices associated with this home ID
    const result = await pool.query(
      "SELECT * FROM devices WHERE home_id = $1",
      [homeId]
    );

    // Respond with the devices as JSON
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching devices" });
  }
});

// Add Device Endpoint
app.post("/api/devices", async (req, res) => {
  const { device_name, device_type, device_status } = req.body;
  const home_id = req.session.home_id; // Retrieve home_id from the session

  // Check if home_id is available in the session
  if (!home_id) {
    return res.status(401).json({ message: "User is not authenticated." });
  }

  // Check if all required fields are provided
  if (!device_name || !device_type || !device_status) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Insert the new device into the database
    const query = `
      INSERT INTO devices (home_id, device_name, device_type, device_status)
      VALUES ($1, $2, $3, $4)
      RETURNING device_id, home_id, device_name, device_type, device_status, created_at;
    `;
    const values = [home_id, device_name, device_type, device_status];

    const result = await pool.query(query, values);

    // Send back the newly created device details
    res.status(201).json({
      message: "Device added successfully",
      device: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding device:", error);

    if (error.code === "23503") {
      // Foreign key violation
      return res
        .status(400)
        .json({ message: "Invalid home_id. Home does not exist." });
    }

    res.status(500).json({ message: "An unexpected error occurred." });
  }
});

//Update Device Endpoint
app.put("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;

  // Find the device with the given ID
  const device = devices.find((device) => device.id === parseInt(id));

  // If the device is found, update its name and type
  if (device) {
    device.name = name;
    device.type = type;
    res.json(device);
  } else {
    res.status(404).json({ message: "Device not found" });
  }
});

//Delete Device Endpoint
app.delete("/api/devices/:id", (req, res) => {
  const { id } = req.params;

  // Find the device with the given ID
  const index = devices.findIndex((device) => device.id === parseInt(id));

  // If the device is found, remove it from the devices array
  if (index !== -1) {
    devices.splice(index, 1);
    res.status(204).json({ message: "Device deleted successfully" });
  } else {
    res.status(404).json({ message: "Device not found" });
  }
});

//Control Device Endpoint
app.post("/api/devices/:id/control", (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  // Find the device with the given ID
  const device = devices.find((device) => device.id === parseInt(id));

  // If the device is not found, return a 404 error
  if (!device) {
    return res.status(404).json({ message: "Device not found" });
  }

  // Control the device based on the action
  switch (action) {
    case "turn_on":
      if (device.type === "light") {
        device.status = "on";
        res.json({ message: `${device.name} is now turned on.` });
      } else {
        res
          .status(400)
          .json({ message: `${device.name} cannot be turned on.` });
      }
      break;
    case "turn_off":
      if (device.type === "light") {
        device.status = "off";
        res.json({ message: `${device.name} is now turned off.` });
      } else {
        res
          .status(400)
          .json({ message: `${device.name} cannot be turned off.` });
      }
      break;
    case "lock":
      if (device.type === "lock") {
        device.status = "locked";
        res.json({ message: `${device.name} is now locked.` });
      } else {
        res.status(400).json({ message: `${device.name} cannot be locked.` });
      }
      break;
    case "unlock":
      if (device.type === "lock") {
        device.status = "unlocked";
        res.json({ message: `${device.name} is now unlocked.` });
      } else {
        res.status(400).json({ message: `${device.name} cannot be unlocked.` });
      }
      break;
    default:
      res.status(400).json({ message: `Invalid action: ${action}` });
  }
});

//Get Device Status Endpoint
app.get("/api/devices/:id/status", (req, res) => {
  const { id } = req.params;
  const device = devices.find((device) => device.id === parseInt(id));

  if (device) {
    res.json(device.status);
  } else {
    res.status(404).json({ message: "Device not found" });
  }
});

//Get Scenes Endpoint
app.get("/api/scenes", (req, res) => {
  res.json(scenes);
});

//Activate Scene Endpoint
app.post("/api/scenes/:id/activate", (req, res) => {
  const { id } = req.params;
  const scene = scenes.find((scene) => scene.id === parseInt(id));

  // If the scene is not found, return a 404 error
  if (!scene) {
    return res.status(404).json({ message: "Scene not found" });
  }

  // Execute the actions defined in the scene
  for (const action of scene.actions) {
    const device = devices.find((device) => device.id === action.deviceId);
    if (!device) {
      return res
        .status(404)
        .json({ message: `Device with ID ${action.deviceId} not found` });
    }

    // Control the device based on the action
    switch (action.action) {
      case "turn_on":
        if (device.type === "light") {
          device.status = "on";
        } else {
          return res
            .status(400)
            .json({ message: `${device.name} cannot be turned on.` });
        }
        break;
      case "turn_off":
        if (device.type === "light") {
          device.status = "off";
        } else {
          return res
            .status(400)
            .json({ message: `${device.name} cannot be turned off.` });
        }
        break;
      case "set_temperature":
        if (device.type === "thermostat") {
          device.status = `set to ${action.value}°C`;
        } else {
          return res
            .status(400)
            .json({ message: `${device.name} cannot set temperature.` });
        }
        break;
      case "lock":
        if (device.type === "lock") {
          device.status = "locked";
        } else {
          return res
            .status(400)
            .json({ message: `${device.name} cannot be locked.` });
        }
        break;
      case "unlock":
        if (device.type === "lock") {
          device.status = "unlocked";
        } else {
          return res
            .status(400)
            .json({ message: `${device.name} cannot be unlocked.` });
        }
        break;
      default:
        return res
          .status(400)
          .json({ message: `Invalid action: ${action.action}` });
    }
  }

  // Respond with a success message
  res.json({ message: `Scene '${scene.name}' activated successfully.` });
});

//Get Automations Endpoint
app.get("/api/automations", (req, res) => {
  res.json(automations);
});

//Trigger Automation Endpoint
app.post("/api/automations/:id/trigger", (req, res) => {
  const { id } = req.params;

  // Find the automation by ID
  const automation = automations.find(
    (automation) => automation.id === parseInt(id)
  );

  // If the automation is not found, return a 404 error
  if (!automation) {
    return res.status(404).json({ message: "Automation not found" });
  }

  // Execute the actions defined in the automation
  for (const action of automation.actions) {
    const device = devices.find((device) => device.id === action.deviceId);
    if (!device) {
      return res
        .status(404)
        .json({ message: `Device with ID ${action.deviceId} not found` });
    }

    // Control the device based on the action
    switch (action.action) {
      case "turn_on":
        if (device.type === "light") {
          device.status = "on";
        } else {
          return res
            .status(400)
            .json({ message: `${device.name} cannot be turned on.` });
        }
        break;
      case "turn_off":
        if (device.type === "light") {
          device.status = "off";
        } else {
          return res
            .status(400)
            .json({ message: `${device.name} cannot be turned off.` });
        }
        break;
      case "set_temperature":
        if (device.type === "thermostat") {
          device.status = `set to ${action.value}°C`;
        } else {
          return res
            .status(400)
            .json({ message: `${device.name} cannot set temperature.` });
        }
        break;
      case "lock":
        if (device.type === "lock") {
          device.status = "locked";
        } else {
          return res
            .status(400)
            .json({ message: `${device.name} cannot be locked.` });
        }
        break;
      case "unlock":
        if (device.type === "lock") {
          device.status = "unlocked";
        } else {
          return res
            .status(400)
            .json({ message: `${device.name} cannot be unlocked.` });
        }
        break;
      default:
        return res
          .status(400)
          .json({ message: `Invalid action: ${action.action}` });
    }
  }

  // Respond with a success message
  res.json({
    message: `Automation '${automation.name}' triggered successfully.`,
  });
});

//Get User Preferences Endpoint
app.get("/user/preferences/:userId", (req, res) => {
  const { userId } = req.params;

  // Find the user preferences by user ID
  const userPref = userPreferences.find(
    (pref) => pref.userId === parseInt(userId)
  );

  // If the user preferences are not found, return a 404 error
  if (!userPref) {
    return res.status(404).json({ message: "User  preferences not found" });
  }

  // Respond with the user preferences
  res.json(userPref.preferences);
});

//Update User Preferences Endpoint
app.put("/user/preferences/:userId", (req, res) => {
  const { userId } = req.params;
  const { preferences } = req.body;

  // Find the user preferences by user ID
  const userPrefIndex = userPreferences.findIndex(
    (pref) => pref.userId === parseInt(userId)
  );

  // If the user preferences are not found, return a 404 error
  if (userPrefIndex === -1) {
    return res.status(404).json({ message: "User  preferences not found" });
  }

  // Update the user preferences
  userPreferences[userPrefIndex].preferences = {
    ...userPreferences[userPrefIndex].preferences,
    ...preferences,
  };

  // Respond with the updated user preferences
  res.json(userPreferences[userPrefIndex].preferences);
});

//Get Notifications Endpoint
app.get("/user/notifications/:userId", (req, res) => {
  const { userId } = req.params;

  // Find notifications for the specified user ID
  const userNotifications = notifications.filter(
    (notification) => notification.userId === parseInt(userId)
  );

  // If no notifications are found, return an empty array
  if (userNotifications.length === 0) {
    return res
      .status(404)
      .json({ message: "No notifications found for this user." });
  }

  // Respond with the user's notifications
  res.json(userNotifications);
});

//Acknowledge Notification Endpoint

//Get Integrations Endpoint

//Connect Integration Endpoint
