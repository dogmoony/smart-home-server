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
  e.preventDefault();

  const deviceId = document.getElementById("update_device_id").value;
  const device_name = document.getElementById("update_device_name").value;
  const device_type = document.getElementById("update_device_type").value;
  const device_status = document.getElementById("update_device_status").value;

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
      fetchDevices(); // Refresh devices list
      closeUpdateModal();
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

// Function to close the update modal
function closeUpdateModal() {
  document.getElementById("update-modal").style.display = "none";
}

// Add event listener for the update form submission
document
  .getElementById("update-device-form")
  .addEventListener("submit", updateDevice);

// Close update modal if the user clicks outside of it
window.addEventListener("click", (event) => {
  const modal = document.getElementById("update-modal");
  if (event.target === modal) {
    closeUpdateModal();
  }
});
