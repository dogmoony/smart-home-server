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
