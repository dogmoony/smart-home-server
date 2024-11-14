// Fetch the username on page load
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

// Function to update a device in the database
async function updateDevice(deviceId, updates) {
  try {
    const response = await fetch(
      `http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices/${deviceId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update device");
    }

    const updatedDevice = await response.json();
    console.log("Device updated successfully:", updatedDevice);

    // Close the modal
    document.getElementById("update-modal").style.display = "none";

    // Refresh the device list
    await fetchDevices();
  } catch (error) {
    console.error("Error updating device:", error);
    const messageElement = document.getElementById("update-message");
    messageElement.textContent = "Failed to update device.";
    messageElement.style.color = "red";
  }
}

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

// Function to open the update modal and populate with device data
function openUpdateModal(deviceId) {
  const modal = document.getElementById("update-modal");
  const nameInput = document.getElementById("update-device-name");
  const typeInput = document.getElementById("update-device-type");
  const statusInput = document.getElementById("update-device-status");
  const messageElement = document.getElementById("update-message");

  // Fetch current device details and populate modal fields
  fetch(
    `http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices/${deviceId}`
  )
    .then((response) => response.json())
    .then((device) => {
      nameInput.value = device.device_name;
      typeInput.value = device.device_type;
      statusInput.value = device.device_status;
      modal.style.display = "flex"; // Open modal
    })
    .catch((error) => {
      console.error("Error fetching device data:", error);
      messageElement.textContent = "Could not load device details.";
      messageElement.style.color = "red";
    });

  // Update form submit handler with deviceId for updating
  document.getElementById("update-device-form").onsubmit = async function (
    event
  ) {
    event.preventDefault();
    await updateDevice(deviceId, {
      name: nameInput.value,
      type: typeInput.value,
      status: statusInput.value,
    });
  };
}

// JavaScript for handling add-device form submission
document
  .getElementById("add-device-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    // Collect data from form fields
    const name = document.getElementById("device_name").value;
    const type = document.getElementById("device_type").value;
    const status = document.getElementById("device_status").value;

    // Display a loading message
    const messageElement = document.getElementById("message");
    messageElement.textContent = "Adding device...";

    try {
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, status }),
      });

      const data = await response.json();

      if (response.ok) {
        messageElement.textContent = "Device added successfully!";
        messageElement.style.color = "green";
        document.getElementById("add-device-form").reset();
        await fetchDevices(); // Refresh the device list after adding a new one
      } else {
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
const updateModal = document.getElementById("update-modal");
document.getElementById("open-modal-btn").addEventListener("click", () => {
  updateModal.style.display = "flex"; // Set modal display to flex to center it
});
document.getElementById("close-update-modal").addEventListener("click", () => {
  updateModal.style.display = "none";
});
window.addEventListener("click", (event) => {
  if (event.target === updateModal) {
    updateModal.style.display = "none";
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
