fetch("/username")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Not logged in");
    }
    return response.json();
  })
  .then((data) => {
    document.getElementById(
      "greeting"
    ).textContent = `Welcome to your smart home, ${data.username}!`;
  })
  .catch((error) => {
    console.error("Error fetching username:", error);
    window.location.href = "/login.html"; // Redirect to login if unauthorized
  });

// Function to fetch and display devices
async function fetchDevices(retry = true) {
  try {
    const response = await fetch(
      "http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices",
      { credentials: "include" }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch devices");
    }

    const devices = await response.json();
    const container = document.getElementById("device-container");
    container.innerHTML = ""; // Clear previous content

    devices.forEach((device) => {
      const deviceDiv = document.createElement("div");
      deviceDiv.classList.add("device");

      deviceDiv.innerHTML = `
      <div class="device-row">
      
        <!-- First column: Device Name -->
          <div class="device-column device-name">
          <h2>${device.device_name}</h2>
          </div>

        <!-- Second column: Type and Status -->
          <div class="device-column device-info">
          <p>Type: ${device.device_type}</p>
          <p>Status: ${device.device_status}</p>
          <p>Created At: ${new Date(device.created_at).toLocaleString()}</p>
          </div>

        <!-- Third column: Buttons -->
          <div class="device-column device-actions">
          <button class="update-button" data-id="${
            device.device_id
          }">Update</button>
          <button class="delete-button" data-id="${
            device.device_id
          }">Delete</button>
          </div>
        </div>
      `;
      container.appendChild(deviceDiv);
    });

    // Attach delete button functionality
    document.querySelectorAll(".delete-button").forEach((button) => {
      button.addEventListener("click", (event) => {
        const deviceId = event.target.getAttribute("data-id");
        deleteDevice(deviceId);
      });
    });

    // Attach update button functionality
    document.querySelectorAll(".update-button").forEach((button) => {
      button.addEventListener("click", (event) => {
        const deviceId = event.target.getAttribute("data-id");
        openUpdateModal(deviceId);
      });
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    document.getElementById("message").textContent = error.message;

    // Retry logic
    if (retry) {
      setTimeout(() => fetchDevices(false), 1000);
    }
  }
}

// JavaScript for handling form submission
document
  .getElementById("add-device-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the default form submission behavior

    // Collect data from form fields
    const name = document.getElementById("device_name").value;
    const type = document.getElementById("device_type").value;
    const status = document.getElementById("device_status").value;

    // Display a loading message or disable submit button temporarily
    const messageElement = document.getElementById("message");
    messageElement.textContent = "Adding device...";

    try {
      // Send the data to the backend API
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, status }), // Send form data in request body
      });

      // Parse the JSON response
      const data = await response.json();

      if (response.ok) {
        // Display success message and reset the form
        messageElement.textContent = "Device added successfully!";
        messageElement.style.color = "green";
        document.getElementById("add-device-form").reset();
      } else {
        // Display error message from server response
        messageElement.textContent = data.message || "An error occurred.";
        messageElement.style.color = "red";
      }
    } catch (error) {
      console.error("Error:", error);
      messageElement.textContent = `Failed to add device: ${error.message}`;
      messageElement.style.color = "red";
    }
  });

// JavaScript code to open and close the modal

// Select elements
const modal = document.getElementById("modal");
const openModalBtn = document.getElementById("open-modal-btn");
const closeModalBtn = document.getElementById("close-btn");

// Open modal when clicking the "Open Window" button
openModalBtn.addEventListener("click", () => {
  modal.style.display = "flex"; // Set modal display to flex to center it
});

// Close modal when clicking the "X" close button
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Close modal when clicking outside of the modal content
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

// Check for the token on page load and fetch devices if authenticated
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/login.html"; // Redirect if not logged in
  } else {
    fetchDevices(true); // Fetch devices after confirming the user is authenticated
  }
});

function showPage(pageId, event) {
  // Hide all pages
  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => {
    page.classList.remove("active");
  });

  // Show the selected page
  const selectedPage = document.getElementById(pageId);
  selectedPage.classList.add("active");

  // Update the active button
  const buttons = document.querySelectorAll(".menu-panel button");
  buttons.forEach((button) => button.classList.remove("active"));

  // Add active class to the clicked button
  event.target.classList.add("active");
}

async function deleteDevice(deviceId) {
  try {
    const response = await fetch(`/api/devices/${deviceId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok) {
      console.log(data.message); // Device deleted successfully
    } else {
      console.error(data.message); // Display error from the server
    }
  } catch (error) {
    console.error("Error deleting device:", error);
  }
}
