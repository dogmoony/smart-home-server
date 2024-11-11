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
        <h2>${device.device_name}</h2>
        <p>Type: ${device.device_type}</p>
        <p>Status: ${device.device_status}</p>
        <p>Created At: ${new Date(device.created_at).toLocaleString()}</p>
        <button class="delete-button" data-id="${
          device.device_id
        }">Delete</button>
        <button class="update-button" data-id="${
          device.device_id
        }">Update</button>
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

    // Display a loading message or disable submit button temporarily
    const messageElement = document.getElementById("message");
    messageElement.textContent = "Adding device...";

    try {
      // Send the data to the backend API
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }), // Send form data in request body
      });

      // Parse the JSON response
      const data = await response.json();

      if (response.ok) {
        // Display success message and reset the form
        messageElement.textContent = "Device added successfully!";
        document.getElementById("add-device-form").reset();

        // Optionally close the modal after successful submission
        closeModal();
      } else {
        // Display error message from server response
        messageElement.textContent = data.message || "An error occurred.";
      }
    } catch (error) {
      console.error("Error:", error);
      messageElement.textContent = "Failed to add device.";
    }
  });

// Function to open and close the modal
document.getElementById("open-modal-btn").addEventListener("click", openModal);
document.getElementById("close-btn").addEventListener("click", closeModal);

function openModal() {
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

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
