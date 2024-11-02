document
  .getElementById("create-account-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get input values
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      // Send POST request to the backend
      const res = await fetch(
        "http://ec2-3-8-8-117.eu-west-2.compute.amazonaws.com:5000/auth/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, email, password }),
        }
      );

      const result = await res.json();

      const messageElement = document.getElementById("message");
      if (res.ok) {
        messageElement.textContent = result.message; // Success message
        messageElement.style.color = "green";
      } else {
        // Show the error message from the server if it exists
        messageElement.textContent = result.message || "Error creating account";
        messageElement.style.color = "red";
      }
    } catch (error) {
      console.error("Error:", error);
      document.getElementById("message").textContent =
        "An error occurred. Please try again.";
    }
  });
