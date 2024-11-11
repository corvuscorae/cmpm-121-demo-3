// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
import luck from "./luck.ts";
import { Board, Cell } from "./board.ts";

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
const CACHE_LUCK_MOD = "52 Ally's";
const COIN_LUCK_MOD = "sagan";
const SPAWN_PROBABILITY = 0.10; // 10% spawn probability

//  > player icon stuff
const ICON_IMG = document.createElement("img");
ICON_IMG.src = import.meta.resolve("../smiley.png");
const ICON_URL = ICON_IMG.src;
const ICON_WIDTH = MY_WINDOW.WIDTH / 18;

//* INTERFACES *//
interface Cache {
  cell: Cell;
  coins: string[];
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
  coins: <string[]> [],
  message: document.createElement("div"),
  tooltip: () => {
    player.message.innerHTML =
      `you have <span id="value">${player.coins.length}</span> coins`;
    return player.avatar.bindTooltip(player.message, {
      offset: [ICON_WIDTH / 2, 0],
    });
  },
};
player.avatar.addTo(map);
player.tooltip();

const statusBar = document.getElementById("statusbar");

//* GRID *//
const board: Board = new Board(CELL_WIDTH, NEIGHBORHOOD_SIZE);

const neighborCache: Cache[] = [];
const neighborCell: Cell[] = board.getCellsNearPoint(player.location);

neighborCell.forEach((neighbor) => {
  const i = neighbor.i;
  const j = neighbor.j;
  const roll = luck([i, j, CACHE_LUCK_MOD].toString());
  if (roll < SPAWN_PROBABILITY) neighborCache.push(makeCache(neighbor));
});

//* CACHES *//
function makeCache(cell: Cell) {
  const cache: Cache = {
    cell: cell,
    coins: generateCoins(cell),
    message: document.createElement("div"),
    popup: () => {
      const rect = leaflet.rectangle(board.getCellBounds(cache.cell));
      rect.addTo(map);
      rect.bindPopup(() => {
        cache.message.innerHTML =
          `<div>This is a cache with <span id="value">${cache.coins.length}</span> coins</div>
          <div>location: (${cache.cell.i}, ${cache.cell.j})</div>
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

function generateCoins(cell: Cell) {
  const coordString = `${cell.i}:${cell.j}`;
  const amount = Math.floor(
    luck([cell.i, cell.j, COIN_LUCK_MOD].toString()) * 100,
  );
  const coins = [];
  for (let i = 1; i <= amount; i++) {
    coins.push(`${coordString}#${i}`);
  }
  return coins;
}

//  > helper function(s) (cache)
function cacheButtonsHandler(cache: Cache, buttons: HTMLButtonElement[]) {
  const cacheValue = cache.message.querySelector<HTMLSpanElement>("#value")!;
  const playerValue = player.message.querySelector<HTMLSpanElement>("#value")!;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      //const delta = (button.id === "collect") ? "" : 1;
      const limiter = (button.id === "collect")
        ? cache.coins.length
        : player.coins.length;
      if (limiter > 0) {
        switch (button.id) {
          case "collect":
            player.coins.push(cache.coins.pop()!);
            break;
          case "deposit":
            cache.coins.push(player.coins.pop()!);
            break;
          default:
            break;
        }
      }
      cacheValue.innerHTML = cache.coins.length.toString();
      playerValue.innerHTML = player.coins.length.toString();
      statusBar!.innerHTML = arrayToString(player.coins);
    });
  });
}

//  > put caches on map
neighborCache.forEach((cache) => {
  cache.popup();
});

///// DEBUG

function arrayToString(array: string[]) {
  let result = "";
  array.forEach((elem) => {
    result = `${result} ${elem}`;
  });
  return result;
}
