// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

// debug toolbox
const debug = {
  allowZoom: false,
};

const MY_WINDOW = {
  WIDTH: globalThis.innerWidth,
  HEIGHT: globalThis.innerHeight,
};

const INIT_LOCATION = leaflet.latLng(36.98949379578401, -122.06277128548504);
const MAX_ZOOM = 23;
const MIN_ZOOM = 15;
const INIT_ZOOM = (MAX_ZOOM + MIN_ZOOM) / 2;

const map = leaflet.map(document.getElementById("map")!, {
  center: INIT_LOCATION,
  zoom: INIT_ZOOM,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  zoomControl: debug.allowZoom,
  scrollWheelZoom: debug.allowZoom,
});

leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: MAX_ZOOM,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// add a player avatar
const img = document.createElement("img");
img.src = import.meta.resolve("../smiley.png");
const ICON_URL = img.src;

const myIcon = leaflet.icon({
  iconUrl: ICON_URL,
  iconSize: [MY_WINDOW.WIDTH / 15, MY_WINDOW.WIDTH / 15],
});

const playerAvatar = leaflet.marker(INIT_LOCATION, { icon: myIcon });
playerAvatar.addTo(map);

const CELL_WIDTH = 0.0001;
const LOCALITY = 8;
for (let i = -LOCALITY; i < LOCALITY; i++) {
  for (let j = -LOCALITY; j < LOCALITY; j++) {
    const cell = leaflet.latLngBounds([
      [INIT_LOCATION.lat + i * CELL_WIDTH, INIT_LOCATION.lng + j * CELL_WIDTH],
      [
        INIT_LOCATION.lat + (i + 1) * CELL_WIDTH,
        INIT_LOCATION.lng + (j + 1) * CELL_WIDTH,
      ],
    ]);

    const rect = leaflet.rectangle(cell);
    rect.addTo(map);
  }
}
