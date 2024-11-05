// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet, { Rectangle } from "leaflet";
import luck from "./luck.ts";

// style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

//* DEBUG TOOLBOX *//
const DEBUG = {
  ALLOW_ZOOM: false,
  INIT_PLAYER_CACHE: 0,
};

//* TUNABLE VARIABLES */
const MY_WINDOW = {
  WIDTH: globalThis.innerWidth,
  HEIGHT: globalThis.innerHeight,
};
//  > map stuff
const INIT_LOCATION = leaflet.latLng(36.98949379578401, -122.06277128548504);
const MAX_ZOOM = 23;
const MIN_ZOOM = 15;
const INIT_ZOOM = (MAX_ZOOM + MIN_ZOOM) / 2;

//  > GRID STUFF
const CELL_WIDTH = 0.00008;
const NEIGHBORHOOD_SIZE = 8;

//  > cache stuff
const CACHE_LUCK_MOD = "raven";
const COIN_LUCK_MOD = "allison";
const SPAWN_PROBABILITY = 0.10; // 10% spawn probability

//  > player icon stuff
const ICON_IMG = document.createElement("img");
ICON_IMG.src = import.meta.resolve("../smiley.png");
const ICON_URL = ICON_IMG.src;
const ICON_WIDTH = MY_WINDOW.WIDTH / 18;

//* INTERFACES *//
interface Cache {
  rect: Rectangle;
  coins: number;
  message: HTMLDivElement;
  popup(): void;
}

//* MAP *//
const map = leaflet.map(document.getElementById("map")!, {
  center: INIT_LOCATION,
  zoom: INIT_ZOOM,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  zoomControl: DEBUG.ALLOW_ZOOM,
  scrollWheelZoom: DEBUG.ALLOW_ZOOM,
});
map.doubleClickZoom.disable();

leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: MAX_ZOOM,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

//* PLAYER *//
const myIcon = leaflet.icon({
  iconUrl: ICON_URL,
  iconSize: [ICON_WIDTH, ICON_WIDTH],
});

const player = {
  location: INIT_LOCATION,
  avatar: leaflet.marker(INIT_LOCATION, { icon: myIcon }),
  coins: DEBUG.INIT_PLAYER_CACHE,
  message: document.createElement("div"),
  tooltip: () => {
    player.message.innerHTML =
      `you have <span id="value">${player.coins}</span> coins`;
    return player.avatar.bindTooltip(player.message, {
      offset: [ICON_WIDTH / 2, 0],
    });
  },
};
player.avatar.addTo(map);
player.tooltip();

//* GRID *//
const liveCache: Cache[] = [];
for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    const roll = luck([i, j, CACHE_LUCK_MOD].toString());
    if (roll < SPAWN_PROBABILITY) liveCache.push(makeCache(i, j)); // deterministic cell generation
  }
}

//* CACHES *//
function makeCache(i: number, j: number) {
  const cell = leaflet.latLngBounds([
    [
      player.location.lat + i * CELL_WIDTH,
      player.location.lng + j * CELL_WIDTH,
    ],
    [
      player.location.lat + (i + 1) * CELL_WIDTH,
      player.location.lng + (j + 1) * CELL_WIDTH,
    ],
  ]);

  const cache: Cache = {
    rect: leaflet.rectangle(cell),
    coins: Math.floor(luck([i, j, COIN_LUCK_MOD].toString()) * 100),
    message: document.createElement("div"),
    popup: () => {
      cache.rect.bindPopup(() => {
        cache.message.innerHTML =
          `<div>This is a cache with <span id="value">${cache.coins}</span> coins</div>
          <button id="collect">collect</button>
          <button id="deposit">deposit</button>`;

        const buttons = [
          cache.message.querySelector<HTMLButtonElement>("#collect")!,
          cache.message.querySelector<HTMLButtonElement>("#deposit")!,
        ];
        cacheButtonsHandler(cache, buttons);

        return cache.message;
      });
    },
  };

  return cache;
}

//  > helper function(s) (cache)
function cacheButtonsHandler(cache: Cache, buttons: HTMLButtonElement[]) {
  const cacheValue = cache.message.querySelector<HTMLSpanElement>("#value")!;
  const playerValue = player.message.querySelector<HTMLSpanElement>("#value")!;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const delta = (button.id === "collect") ? -1 : 1;
      const limiter = (button.id === "collect") ? cache.coins : player.coins;
      if (limiter > 0) {
        cache.coins += delta;
        player.coins -= delta;
      }
      cacheValue.innerHTML = cache.coins.toString();
      playerValue.innerHTML = player.coins.toString();
    });
  });
}

//  > put caches on map
liveCache.forEach((cache) => {
  cache.rect.addTo(map);
  cache.popup();
});
