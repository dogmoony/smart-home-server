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

    // Display response message to the user
    const messageElement = document.getElementById("message");
    if (res.ok) {
      messageElement.textContent = result.message; // Success message
      messageElement.style.color = "green";
      // You can also redirect to another page or perform other actions here
    } else {
      messageElement.textContent = result.message; // Display the error message from the server
      messageElement.style.color = "red";
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("message").textContent =
      "An error occurred. Please try again.";
  }
});
