

document.addEventListener("DOMContentLoaded", function () {
    const role = sessionStorage.getItem("learnhubRole");

    if (role !== "admin") {
        window.location.replace("admin-login.html");
        return;
    }

    const adminName = sessionStorage.getItem("learnhubName") || "Admin";

    const loggedInName = document.getElementById("loggedInName");
    const welcomeName = document.getElementById("welcomeName");

    if (loggedInName) {
        loggedInName.textContent = adminName;
    }

    if (welcomeName) {
        welcomeName.textContent = adminName;
    }
});
