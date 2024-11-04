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

// Function to open the add device modal
document.getElementById("open-modal-btn").addEventListener("click", () => {
  document.getElementById("modal").style.display = "block";
});

// Function to close the modal
document.getElementById("close-btn").addEventListener("click", () => {
  document.getElementById("modal").style.display = "none";
});

// Close modal if the user clicks outside of it
window.addEventListener("click", (event) => {
  const modal = document.getElementById("modal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

// Function to add a device
async function addDevice(e) {
  e.preventDefault(); // Prevent default form submission
  const device_name = document.getElementById("device_name").value;
  const device_type = document.getElementById("device_type").value;
  const device_status = document.getElementById("device_status").value;

  try {
    const response = await fetch(
      "http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ device_name, device_type, device_status }),
      }
    );

    if (response.ok) {
      document.getElementById("message").textContent =
        "Device added successfully!";
      document.getElementById("message").style.color = "green";
      fetchDevices(); // Refresh devices list
      closeAddDeviceModal(); // Close modal after successful addition
    } else {
      const errorMessage = await response.json();
      document.getElementById("message").textContent =
        errorMessage.message || "Failed to add device.";
      document.getElementById("message").style.color = "red";
    }
  } catch (error) {
    console.error("Error adding device:", error);
    document.getElementById("message").textContent =
      "An error occurred. Please try again.";
    document.getElementById("message").style.color = "red";
  }
}

// Event listener for the add device form submission
document
  .getElementById("add-device-form")
  .addEventListener("submit", addDevice);

// Function to delete a device
async function deleteDevice(deviceId) {
  try {
    const response = await fetch(
      `http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices/${deviceId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (response.ok) {
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
    fetchDevices(true); // Fetch devices after confirming the user is authenticated
  }
});
