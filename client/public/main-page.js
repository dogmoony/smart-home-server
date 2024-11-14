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

// Deleting device
//
// Function to delete a device from the device list and refresh the list
async function deleteDevice(deviceId) {
  try {
    const response = await fetch(
      `http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices/${deviceId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete device");
    }

    const deletedDevice = await response.json();
    console.log(`Deleted device: ${deletedDevice.device_name}`);

    // Fetch and render the updated device list
    await fetchDevices(); // This function should handle rendering the updated list
  } catch (error) {
    console.error("Error deleting device:", error);
  }
}
//-------------------------------------------------------------------------------------------

// Modal elements
const updateModal = document.getElementById("update-modal");
const closeUpdateModalBtn = document.getElementById("close-update-modal");
const updateMessage = document.getElementById("update-message");

// Fetch and display the devices, and attach event listeners
async function fetchDevices() {
  try {
    const response = await fetch(
      "http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices",
      {
        credentials: "include",
      }
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
          <div class="device-column device-name">
            <h2>${device.device_name}</h2>
          </div>
          <div class="device-column device-info">
            <p>Type: ${device.device_type}</p>
            <p>Status: ${device.device_status}</p>
            <p>Created At: ${new Date(device.created_at).toLocaleString()}</p>
          </div>
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

    // Attach update button functionality
    document.querySelectorAll(".update-button").forEach((button) => {
      button.addEventListener("click", (event) => {
        const deviceId = event.target.getAttribute("data-id");
        openUpdateModal(deviceId); // Pass the deviceId to the modal
      });
    });

    // Attach delete button functionality
    document.querySelectorAll(".delete-button").forEach((button) => {
      button.addEventListener("click", (event) => {
        const deviceId = event.target.getAttribute("data-id");
        deleteDevice(deviceId); // Handle the deletion
      });
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    document.getElementById("message").textContent = error.message;
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
        await fetchDevices(); // Refresh the device list after adding a new one
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

// Updating device
//

// Function to open the update modal with pre-filled device data
function openUpdateModal(deviceId) {
  // Fetch device details from the API to populate the modal (use the deviceId)
  fetch(
    `http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices/${deviceId}`
  )
    .then((response) => response.json())
    .then((device) => {
      // Pre-fill the form fields with the device details
      document.getElementById("update-device-name").value = device.device_name;
      document.getElementById("update-device-type").value = device.device_type;
      document.getElementById("update-device-status").value =
        device.device_status;

      // Store the deviceId to use later when updating
      updateModal.setAttribute("data-device-id", deviceId);

      // Show the modal
      updateModal.style.display = "flex";
    })
    .catch((error) => {
      console.error("Error fetching device details:", error);
    });
}

// Close the modal when the close button is clicked
closeUpdateModalBtn.addEventListener("click", () => {
  updateModal.style.display = "none";
  updateMessage.textContent = ""; // Clear any previous messages
});

// Close the modal if clicked outside of the modal content
window.addEventListener("click", (event) => {
  if (event.target === updateModal) {
    updateModal.style.display = "none";
    updateMessage.textContent = "";
  }
});

// Handle form submission to update device
document
  .getElementById("update-device-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    // Get the deviceId from the modal
    const deviceId = updateModal.getAttribute("data-device-id");

    // Collect updated data from the form fields
    const name = document.getElementById("update-device-name").value;
    const type = document.getElementById("update-device-type").value;
    const status = document.getElementById("update-device-status").value;

    updateMessage.textContent = "Updating device...";

    try {
      const response = await fetch(
        `http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices/${deviceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, type, status }),
        }
      );

      if (response.ok) {
        updateMessage.textContent = "Device updated successfully!";
        updateMessage.style.color = "green";
        await fetchDevices(); // Refresh the device list after update
        updateModal.style.display = "none"; // Close the modal
      } else {
        const errorData = await response.json();
        updateMessage.textContent = errorData.message || "Update failed.";
        updateMessage.style.color = "red";
      }
    } catch (error) {
      console.error("Error updating device:", error);
      updateMessage.textContent = "Failed to update device.";
      updateMessage.style.color = "red";
    }
  });

//-----------------------------------------------------------------------------------------------
