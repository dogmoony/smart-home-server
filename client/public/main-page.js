// Check for the token on page load
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    // Redirect to login page if no token is found
    window.location.href = "/login.html";
  } else {
    // Show content if token is present
    document.getElementById("content").style.display = "block";
  }
});

// Function to fetch and display devices
async function fetchDevices() {
  try {
    // Fetch data from the backend API
    const response = await fetch(
      "http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com/:5000/api/devices"
    ); // Adjust URL if deployed

    if (!response.ok) {
      throw new Error("Failed to fetch devices");
    }

    // Parse the response JSON
    const devices = await response.json();

    // Display devices in the HTML
    const container = document.getElementById("device-container");
    container.innerHTML = ""; // Clear any existing content

    devices.forEach((device) => {
      // Create a new div for each device
      const deviceDiv = document.createElement("div");
      deviceDiv.classList.add("device");

      // Populate the div with device data
      deviceDiv.innerHTML = `
        <h2>${device.device_name}</h2>
        <p>Type: ${device.device_type}</p>
        <p>Status: ${device.device_status}</p>
        <p>Created At: ${new Date(device.created_at).toLocaleString()}</p>
      `;

      // Append the device div to the container
      container.appendChild(deviceDiv);
    });
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("message").textContent = error.message;
  }
}
// Call the function to fetch and display devices
fetchDevices();

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const openModalBtn = document.getElementById("open-modal-btn");
  const closeModalBtn = document.getElementById("close-btn");
  const form = document.getElementById("add-device-form");
  const messageElement = document.getElementById("message");

  // Show the modal when the "Add Device" button is clicked
  openModalBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // Hide the modal when the close button is clicked
  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
    messageElement.textContent = ""; // Clear any previous message
  });

  // Hide the modal when clicking outside of the modal content
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
      messageElement.textContent = "";
    }
  });

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Get input values
    const device_name = document.getElementById("device_name").value;
    const device_type = document.getElementById("device_type").value;
    const device_status = document.getElementById("device_status").value;

    try {
      // Send POST request to the backend add-device endpoint
      const res = await fetch("http://localhost:5000/api/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ device_name, device_type, device_status }),
      });

      const result = await res.json();

      // Display success or error message
      if (res.ok) {
        messageElement.textContent = "Device added successfully!";
        messageElement.style.color = "green";
        form.reset(); // Clear form fields
        setTimeout(() => {
          modal.style.display = "none"; // Hide the modal after a short delay
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
