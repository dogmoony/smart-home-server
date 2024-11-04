/**
 * Function to fetch and display devices
 * Includes retry logic for session issues
 */
async function fetchDevices(retry = true) {
  try {
    const response = await fetch(
      "http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices",
      { credentials: "include" } // Include credentials for session auth
    );

    if (!response.ok) {
      throw new Error("Failed to fetch devices");
    }

    const devices = await response.json();

    // Display devices in the HTML
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

    // Attach delete button functionality to each button
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

    // Retry once after a delay if session might not have fully loaded yet
    if (retry) {
      setTimeout(() => fetchDevices(false), 1000); // Retry after 1 second
    }
  }
}

// Function to open the update modal and pre-fill device data
async function openUpdateModal(deviceId) {
  const modal = document.getElementById("update-modal");
  modal.style.display = "flex";

  try {
    const response = await fetch(
      `http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices/${deviceId}`,
      { credentials: "include" }
    );

    if (response.ok) {
      const device = await response.json();
      console.log("Fetched device for update:", device); // Debugging log

      // Set values in the modal form
      document.getElementById("update_device_id").value = device.device_id;
      document.getElementById("update_device_name").value = device.device_name;
      document.getElementById("update_device_type").value = device.device_type;
      document.getElementById("update_device_status").value =
        device.device_status;
    } else {
      console.error("Failed to load device data for update.");
    }
  } catch (error) {
    console.error("Error fetching device data:", error);
  }
}

// Function to update a device
async function updateDevice(e) {
  e.preventDefault(); // Prevent default form submission

  const deviceId = document.getElementById("update_device_id").value;
  const device_name = document.getElementById("update_device_name").value;
  const device_type = document.getElementById("update_device_type").value;
  const device_status = document.getElementById("update_device_status").value;

  console.log("Updating device with ID:", deviceId); // Debugging log

  try {
    const response = await fetch(
      `http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices/${deviceId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ device_name, device_type, device_status }),
      }
    );

    if (response.ok) {
      document.getElementById("message").textContent =
        "Device updated successfully!";
      document.getElementById("message").style.color = "green";

      console.log("Device updated:", await response.json()); // Debugging log

      fetchDevices(); // Refresh devices list
      closeUpdateModal(); // Close modal after successful update
    } else {
      document.getElementById("message").textContent =
        "Failed to update device.";
      document.getElementById("message").style.color = "red";
    }
  } catch (error) {
    console.error("Error updating device:", error);
    document.getElementById("message").textContent =
      "An error occurred. Please try again.";
    document.getElementById("message").style.color = "red";
  }
}

// Add event listener for the update form submission
document
  .getElementById("update-device-form")
  .addEventListener("submit", updateDevice);

// Function to delete a device
async function deleteDevice(deviceId) {
  try {
    const response = await fetch(
      `http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices/${deviceId}`,
      {
        method: "DELETE",
        credentials: "include", // Include credentials for session authentication
      }
    );

    if (response.ok) {
      // Remove the device element from the UI
      document
        .querySelector(`button[data-id="${deviceId}"]`)
        .parentElement.remove();

      document.getElementById("message").textContent =
        "Device deleted successfully";
      document.getElementById("message").style.color = "green";
    } else {
      const result = await response.json();
      document.getElementById("message").textContent =
        result.message || "Failed to delete device";
      document.getElementById("message").style.color = "red";
    }
  } catch (error) {
    console.error("Error deleting device:", error);
    document.getElementById("message").textContent =
      "An error occurred. Please try again.";
    document.getElementById("message").style.color = "red";
  }
}

// Check for the token on page load and fetch devices if authenticated
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/login.html"; // Redirect if not logged in
  } else {
    document.getElementById("device-container").style.display = "block";
    fetchDevices(true); // Fetch devices after confirming the user is authenticated
  }
});

// Modal functionality for adding devices
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const openModalBtn = document.getElementById("open-modal-btn");
  const closeModalBtn = document.getElementById("close-btn");
  const form = document.getElementById("add-device-form");
  const messageElement = document.getElementById("message");

  // Open and close modal handlers
  openModalBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
    messageElement.textContent = "";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
      messageElement.textContent = "";
    }
  });

  // Handle form submission to add a device
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const device_name = document.getElementById("device_name").value;
    const device_type = document.getElementById("device_type").value;
    const device_status = document.getElementById("device_status").value;

    try {
      const res = await fetch(
        "http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Include credentials to send session cookies
          body: JSON.stringify({ device_name, device_type, device_status }),
        }
      );

      const result = await res.json();

      if (res.ok) {
        messageElement.textContent = "Device added successfully!";
        messageElement.style.color = "green";
        form.reset();

        // Refresh device list
        fetchDevices();

        // Close modal after delay
        setTimeout(() => {
          modal.style.display = "none";
        }, 1500);
      } else {
        messageElement.textContent = result.message || "Failed to add device";
        messageElement.style.color = "red";
      }
    } catch (error) {
      console.error("Error:", error);
      messageElement.textContent = "An error occurred. Please try again.";
      messageElement.style.color = "red";
    }
  });
});
