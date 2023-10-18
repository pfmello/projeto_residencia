const geolocalButton = document.querySelector(".btn-3");
const mapInfoSection = document.querySelector("#map-info");
const latitudeInfo = document.querySelector("#latitude");
const longitudeInfo = document.querySelector("#longitude");

geolocalButton.addEventListener("click", () => {
  mapInfoSection.style.display = "block";
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    alert("Geolocation is not supported by this browser");
  }
});

/* */
// (() => {})();

function success(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  latitudeInfo.textContent = latitude;
  longitudeInfo.textContent = longitude;
  getMap(latitude, longitude);
}

function error() {
  alert("Não foi possível encontrar a localização !");
}

function getMap(latitude, longitude) {
  const map = L.map("map").setView([latitude, longitude], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  L.marker([latitude, longitude]).addTo(map);
}
