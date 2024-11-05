// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
import luck from "./luck.ts";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

// debug toolbox
const debug = {
  allowZoom: false,
};

const SPAWN_PROBABILITY = 0.10; // 10% spawn probability

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
map.doubleClickZoom.disable();

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

// grid
const CELL_WIDTH = 0.0001;
const LOCALITY = 8;
const liveCache = [];
for (let i = -LOCALITY; i < LOCALITY; i++) {
  for (let j = -LOCALITY; j < LOCALITY; j++) {
    const roll = luck([i, j].toString());
    if (roll < SPAWN_PROBABILITY) liveCache.push(makeCache(i, j)); // deterministic cell generation
  }
}

function makeCache(i: number, j: number) {
  const cell = leaflet.latLngBounds([
    [INIT_LOCATION.lat + i * CELL_WIDTH, INIT_LOCATION.lng + j * CELL_WIDTH],
    [
      INIT_LOCATION.lat + (i + 1) * CELL_WIDTH,
      INIT_LOCATION.lng + (j + 1) * CELL_WIDTH,
    ],
  ]);

  const cache = {
    rect: leaflet.rectangle(cell),
    coins: 10,
    popup: () => {
      cache.rect.bindPopup(() => {
        const message = document.createElement("div");
        message.innerHTML =
          `This is a cache with <span id="value">${cache.coins}</span> coins
        <button id="collect">collect</button>`;

        const value = message.querySelector<HTMLSpanElement>("#value")!;
        const button = message.querySelector<HTMLButtonElement>("#collect")!;
        button.addEventListener("click", () => {
          if (cache.coins > 0) cache.coins--;
          value.innerHTML = cache.coins.toString();
        });
        return message;
      });
    },
  };

  return cache;
}

liveCache.forEach((cache) => {
  cache.rect.addTo(map);
  cache.popup();
});
