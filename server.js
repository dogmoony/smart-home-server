const express = require("express");
const cors = require("cors");
const app = express();
const bcrypt = require("bcrypt");
const pool = require("./pool");
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON data from the request body
app.use(cors()); // Allow all origins or configure specific ones
app.use(express.json());
app.use(express.static("./client/public")); // Serve static files from 'public' folder

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

// Create account endpoint
app.post("/auth/create", async (req, res) => {
  try {
    // Step 1: Pull user data from the request body
    const { username, email, password } = req.body;

    // Step 2: Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Step 3: Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Step 4: Insert user data into the database
    const query = `
      INSERT INTO users (username, email, password) 
      VALUES ($1, $2, $3) 
      RETURNING home_id, username, email;
    `;
    const values = [username, email, hashedPassword];
    const result = await pool.query(query, values);

    // Step 5: Send a response with the created user details (without the password)
    res.status(201).json({
      message: "Account created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    switch (error.code) {
      case "23505":
        return res.status(400).json({
          message: "This username or email is already in use.",
        });
      case "23503":
        return res.status(400).json({
          message: "Invalid data reference. Please check your inputs.",
        });
      default:
        return res.status(500).json({
          message: "An unexpected error occurred. Try again later.",
        });
    }
  }
});

// Login Endpoint
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Query the database to find the user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    console.log("Query result:", result.rows); // Log the result of the query

    // Check if the user exists
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email." });
    }

    const user = result.rows[0];

    // Compare the provided password with the hashed password
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      // Passwords match, login successful
      return res.status(200).json({
        message: "Login successful",
        user: { id: user.id, username: user.username, email: user.email }, // Return user info except the password
      });
    } else {
      // Passwords do not match
      return res.status(401).json({ message: "Invalid password." });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
});

//Logout Endpoint
app.post("/auth/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

//Token Refresh Endpoint
app.post("/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken === "refreshToken") {
    res.json({ accessToken: "newAccessToken" });
  } else {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

//Get Devices Endpoint
app.get("/api/devices", (req, res) => {
  res.json(devices);
});

//Add Device Endpoint
app.post("/api/devices", (req, res) => {
  const { name, type } = req.body;

  // Basic validation
  if (!name || !type) {
    return res.status(400).json({ message: "Name and type are required" });
  }

  // Create a new device object
  const newDevice = {
    id: devices.length + 1, // Simple ID generation
    name,
    type,
  };

  // Add the new device to the devices array
  devices.push(newDevice);

  // Respond with the newly created device
  res.status(201).json(newDevice);
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
