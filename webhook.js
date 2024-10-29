const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");

const app = express();
const PORT = 3000; // You can change this to another port if needed

app.use(bodyParser.json());

// Endpoint to handle GitHub Webhooks
app.post("/webhook", (req, res) => {
  const payload = req.body;

  // Check if this is a push event
  if (payload && payload.ref === "refs/heads/main") {
    // Update branch name if needed
    console.log("Received push event. Pulling changes...");

    // Run git pull and pm2 reload
    exec("git pull origin main && pm2 reload all", (err, stdout, stderr) => {
      if (err) {
        console.error("Error pulling changes:", stderr);
        return res.sendStatus(500);
      }
      console.log("Changes pulled and server reloaded:", stdout);
      res.sendStatus(200);
    });
  } else {
    res.sendStatus(400);
  }
});

app.listen(PORT, () => {
  console.log(`Webhook listener running on port ${PORT}`);
});
