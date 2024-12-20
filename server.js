// Importing needed frameworks and environment variables for the code.
//
const dotenv = require("dotenv"); //---------- Import dotenv for loading environment variables
const express = require("express"); //-------- Import Express framework
const session = require("express-session"); // Import express-session for session management
const path = require("path"); //-------------- Import path module for working with file paths
const cors = require("cors"); //-------------- Import CORS middleware to allow cross-origin requests
const bcrypt = require("bcrypt"); //---------- Import bcrypt for hashing passwords

//------------------------------------------------------------------------------

// Basic structure for Express application and database
//
const app = express(); //---------------- Initializing Express application
const pool = require("./pool"); //------- Import database connection pool
const PORT = process.env.PORT || 5000; // Set server port from environment variable or default to 3000

//------------------------------------------------------------------------------

// Middleware to handle CORS, parse JSON data, serve static files and manage user sessions.
//
app.use(cors()); //--------------------------- Enabling CORS
app.use(express.json()); //------------------- Parse JSON request bodies
app.use(express.static("./client/public")); // Serve static files from public directory
app.use(
  session({
    secret: "your_secret_key", //-------------------------------- Secret key for signing the session ID cookie
    resave: false, //-------------------------------------------- Prevents resaving sessions if unmodified
    saveUninitialized: true, //---------------------------------- Forces a session that is uninitialized to be saved to the store
    cookie: { secure: process.env.NODE_ENV === "production" }, // Set cookie to be secure in production
  })
);

//------------------------------------------------------------------------------

// API endpoints for user authentication and device management
//

// Listen on specified PORT
//
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
//-------------------------------------------------

// Creating account endpoint
//
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
//------------------------------------------------------------------------------

// Login Endpoint
//
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
      req.session.homeId = user.home_id;
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
//-------------------------------------------------------------------------------

//Getting the username from the server
//
app.get("/username", (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ username: req.session.username });
});
//---------------------------------------------------------

// Logout Endpoint
//
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
//-------------------------------------------------------------------------------

// Main Page Endpoint (Protected Route)
//
app.get("/main", (req, res) => {
  if (!req.session.username) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "client", "public", "main-page.html"));
});
//-------------------------------------------------------------------------

// Updated Get Devices Endpoint with Logging
//
app.get("/api/devices", async (req, res) => {
  const homeId = req.session.homeId; // Retrieve home_id from session

  console.log("Fetching devices for session homeId:", homeId); // Log the session homeId for debugging

  if (!homeId) {
    return res.status(401).json({ message: "User is not authenticated." }); // Check if user is authenticated
  }

  try {
    const result = await pool.query(
      "SELECT * FROM devices WHERE home_id = $1",
      [homeId]
    ); // Query devices by home_id

    if (result.rows.length === 0) {
      console.log(`No devices found for homeId: ${homeId}`); // Log when no devices are found
      return res
        .status(404)
        .json({ message: "No devices found for this user." }); // Respond with 404 if no devices found
    }

    res.json(result.rows); // Respond with the list of devices
  } catch (error) {
    console.error("Error fetching devices:", error); // Log error details
    res
      .status(500)
      .json({ message: "An error occurred while fetching devices" }); // Handle errors
  }
});
//------------------------------------------------------------------------------

// Add Device Endpoint
//
app.post("/api/devices", async (req, res) => {
  const homeId = req.session.homeId; // Retrieve home_id from session

  if (!homeId) {
    return res.status(401).json({ message: "User is not authenticated." });
  }

  const { name, type, status } = req.body; // Extract device name and type from request body

  if (!name || !type) {
    return res.status(400).json({ message: "Name and type are required." });
  }

  try {
    // Insert device into the database and return the newly created device
    const result = await pool.query(
      "INSERT INTO devices (home_id, device_name, device_type, device_status) VALUES ($1, $2, $3, $4) RETURNING *",
      [homeId, name, type, status]
    );

    res
      .status(201)
      .json({ message: "Device added successfully", device: result.rows[0] });
  } catch (error) {
    console.error("Error adding device:", error);

    if (error.code === "23505") {
      return res.status(400).json({
        message: "Device with the same name already exists for this user.",
      });
    } else {
      return res.status(500).json({ message: "An unexpected error occurred." });
    }
  }
});
//----------------------------------------------------------------------------------

// Delete Device Endpoint
//
app.delete("/api/devices/:id", async (req, res) => {
  const device_id = req.params.id;
  console.log("Deleting device:", device_id);

  if (!device_id) {
    return res.status(400).json({ message: "Device ID is required." });
  }

  const homeId = req.session.homeId;
  try {
    const result = await pool.query(
      "DELETE FROM devices WHERE device_id = $1 AND home_id = $2 RETURNING *",
      [device_id, homeId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Device not found or does not belong to this user." });
    }

    res.status(201).json({ message: "Device deleted successfully" });
  } catch (error) {
    console.error("Error deleting device:", error);
    res.status(500).json({ message: "An unexpected error occurred." });
  }
});
//---------------------------------------------------------------------------------

//Update Device Endpoint
app.put("/api/devices/:id", async (req, res) => {
  const device_id = req.params.id;
  console.log("Updating device:", device_id);
  const { name, type, status } = req.body;

  if (!device_id) {
    return res.status(400).json({ message: "Device ID is required." });
  }
  try {
    const result = await pool.query(
      `UPDATE devices
       SET device_name = $1,
           device_type = $2,
           device_status = $3
       WHERE device_id = $4
       RETURNING *`,
      [name, type, status, device_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Device not found." });
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating device:", error);
    res.status(500).json({ message: "An unexpected error occurred." });
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

//------------------------------------------------------------------------------

//Helper Functions
//
//------------------------------------------------------------------------------
