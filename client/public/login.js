document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault(); // Prevent the default form submission

  // Get input values
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    // Send POST request to the backend login endpoint
    const res = await fetch(
      "http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const result = await res.json();
    const messageElement = document.getElementById("message");

    if (res.ok) {
      // Display success message
      messageElement.textContent = result.message;
      messageElement.style.color = "green"; // Set color to green for success
      localStorage.setItem("authToken", result.token); // Store token if needed
      window.location.href = result.redirectUrl; // Redirect if login is successful
    } else {
      // Display error message
      messageElement.textContent = result.message;
      messageElement.style.color = "red"; // Set color to red for errors
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("message").textContent =
      "An error occurred. Please try again.";
    document.getElementById("message").style.color = "red"; // Set color to red for general errors
  }
});
