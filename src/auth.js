

function toggleMenu() {
    const menu = document.getElementById("menuDropdown");

    if (menu) {
        menu.classList.toggle("show");
    }
}

function toggleTheme() {
    document.body.classList.toggle("light-mode");
}

function userLogin(event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");

    // Frontend demo credentials only
    if (username === "user" && password === "User@123") {
        sessionStorage.setItem("learnhubRole", "user");
        window.location.href = "user.html";
    } else {
        message.textContent =
            "Invalid login details. Please try again.";
    }
}

function adminLogin(event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");

    // Frontend demo credentials only
    if (username === "admin" && password === "Admin@123") {
        sessionStorage.setItem("learnhubRole", "admin");
        window.location.href = "admin.html";
    } else {
        message.textContent =
            "Invalid username or password.";
    }
}

function requireAdmin() {
    if (sessionStorage.getItem("learnhubRole") !== "admin") {
        window.location.replace("admin-login.html");
    }
}

function logout() {
    sessionStorage.removeItem("learnhubRole");
    window.location.href = "index.html";
}

function showSignupMessage(event) {
    event.preventDefault();

    document.getElementById("signupMessage").textContent =
        "Account registration requires a backend or registration system.";
}
