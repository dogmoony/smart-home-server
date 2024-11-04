require("dotenv").config(); // Load environment variables from .env file
const express = require("express"); // Import Express framework
const session = require("express-session"); // Import express-session for session management
const path = require("path"); // Import path module for working with file paths
const cors = require("cors"); // Import CORS middleware to allow cross-origin requests
const bcrypt = require("bcrypt"); // Import bcrypt for hashing passwords

const app = express(); // Initialize Express application
const pool = require("./pool"); // Import database connection pool
const PORT = process.env.PORT || 5000; // Set server port from environment variable or default to 5000

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies
app.use(express.static("./client/public")); // Serve static files from public directory
app.use(
  session({
    secret: "your_secret_key", // Secret key for signing the session ID cookie
    resave: false, // Prevents resaving sessions if unmodified
    saveUninitialized: true, // Forces a session that is uninitialized to be saved to the store
    cookie: { secure: process.env.NODE_ENV === "production" }, // Set cookie to be secure in production
  })
);

// Listen on specified PORT
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

// Create account endpoint
app.post("/auth/create", async (req, res) => {
  try {
    const { username, email, password } = req.body; // Destructure username, email, and password from request body
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" }); // Validate required fields
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING home_id, username, email;
    `;
    const result = await pool.query(query, [username, email, hashedPassword]);
    res.status(201).json({ message: "Account created successfully", user: result.rows[0] }); // Respond with created user info
  } catch (error) {
    console.error("Error creating account:", error); // Log any error that occurs
    // Handle unique constraint errors and unexpected errors
    if (error.code === "23505") {
      return res.status(400).json({ message: "Username or email already in use." });
    } else if (error.code === "23503") {
      return res.status(400).json({ message: "Invalid data reference." });
    } else {
      return res.status(500).json({ message: "An unexpected error occurred." });
    }
  }
});

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, nex


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
