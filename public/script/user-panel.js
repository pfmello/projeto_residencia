const logoutButtonElement = document.getElementById("logout-btn");
const admButtonElement = document.getElementById("adm-btn");

function userLogout() {
  window.location.href = "logout";
}

function adminPanel() {
  window.location.href = "adm";
}

logoutButtonElement.addEventListener("click", userLogout);
admButtonElement.addEventListener("click", adminPanel);
