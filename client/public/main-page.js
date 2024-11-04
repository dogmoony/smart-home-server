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
