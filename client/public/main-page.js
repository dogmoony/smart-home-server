// Check for the token on page load and fetch devices
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/login.html"; // Redirect if not logged in
  } else {
    document.getElementById("content").style.display = "block";
    fetchDevices(); // Call fetchDevices only after confirming the user is authenticated
  }
});

// Function to fetch and display devices
async function fetchDevices() {
  try {
    const response = await fetch(
      "http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/api/devices",
      { credentials: "include" } // Include credentials to use session for authentication
    );

    if (!response.ok) {
      throw new Error("Failed to fetch devices");
    }

    const devices = await response.json();

    // Display devices
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
      `;

      container.appendChild(deviceDiv);
    });
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("message").textContent = error.message;
  }
}

// Modal submission handling
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const openModalBtn = document.getElementById("open-modal-btn");
  const closeModalBtn = document.getElementById("close-btn");
  const form = document.getElementById("add-device-form");
  const messageElement = document.getElementById("message");

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

  // Handle form submission
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

        // Refresh the device list without reloading the page
        fetchDevices();

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
