async function getDevices() {
  try {
    const response = await fetch("http://<EC2-public-IP>:5000/api/devices");
    const devices = await response.json();
    console.log(devices); // Display devices in the console

    // Dynamically render the devices on your HTML page if desired
    const devicesList = document.getElementById("devices-list");
    devices.forEach(device => {
      const listItem = document.createElement("li");
      listItem.textContent = `${device.name} - ${device.type}`;
      devicesList.appendChild(listItem);
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
  }
}

document.addEventListener("DOMContentLoaded", getDevices);
