// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet, { LatLng, Rectangle } from "leaflet";
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
  marker: Rectangle;
  coins: string[];
  message: HTMLDivElement;
  popup(): void;
}

interface MovementButton {
  button: HTMLButtonElement;
  direction: string;
}

//* MEMORY *//
// cache memento configuration inspired by Anthony Nguyen's memento class
// https://github.com/Mapeggs/cmpm-121-demo-3/blob/main/src/main.ts
function cacheMemento(init: Map<string, string[]>) {
  const state = init;

  function restore(key: string) {
    return state.has(key) ? state.get(key) : null;
  }

  function save(key: string, coins: string[]) {
    state.set(key, coins);
  }

  return { restore, save };
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

const movementButtonns = document.getElementById("controlPanel");

const buttons: MovementButton[] = [];
const directions = ["🔼", "🔽", "◀️", "▶️"];
directions.forEach((dir) => {
  const newButton = {
    button: document.createElement("button"),
    direction: dir,
  };
  buttons.push(newButton);
  newButton.button.innerHTML = dir;
  newButton.button.classList.add("panelButton");
  movementButtonns!.appendChild(newButton.button);
});

buttons.forEach((b) => {
  b.button.addEventListener("click", () => {
    switch (b.direction) {
      case "🔼": // move up
        move(player.location, 0, CELL_WIDTH);
        break;
      case "🔽": // move down
        move(player.location, 0, -CELL_WIDTH);
        break;
      case "◀️": // move left
        move(player.location, -CELL_WIDTH, 0);
        break;
      case "▶️": // move right
        move(player.location, CELL_WIDTH, 0);
        break;
      default:
        break;
    }
    player.avatar.setLatLng(player.location);
    map.setView(player.location);
    regenerateCaches(player.location);
  });
});

function move(target: LatLng, x: number, y: number) {
  target.lng += x;
  target.lat += y;
}

//* GRID *//
const board: Board = new Board(CELL_WIDTH, NEIGHBORHOOD_SIZE);

const neighborhood = {
  cacheArray: <Cache[]> [],
  rectArray: <Rectangle[]> [],
  memory: cacheMemento(new Map<string, string[]>()),
};

function regenerateCaches(p: LatLng) {
  const neighborCell: Cell[] = board.getCellsNearPoint(p);

  neighborhood.cacheArray.forEach((cache) => {
    const neighborString = JSON.stringify(cache.cell);
    neighborhood.memory.save(neighborString, cache.coins); // update memento
  });
  neighborhood.cacheArray = [];

  neighborhood.rectArray.forEach((rect) => {
    map.removeLayer(rect);
  });

  neighborCell.forEach((neighbor) => {
    const i = neighbor.i;
    const j = neighbor.j;
    const roll = luck([i, j, CACHE_LUCK_MOD].toString());
    if (roll < SPAWN_PROBABILITY) {
      const neighborString = JSON.stringify(neighbor);
      const mem = neighborhood.memory.restore(neighborString); // check for memento
      neighborhood.cacheArray.push(makeCache(neighbor, mem!));
    }
  });
  console.log(neighborhood.memory);
  //  > put caches on map
  neighborhood.cacheArray.forEach((cache) => {
    cache.popup();
  });
}
regenerateCaches(player.location);

//* CACHES *//
function makeCache(cell: Cell, coins?: string[]) {
  const cache: Cache = {
    cell: cell,
    marker: leaflet.rectangle(board.getCellBounds(cell)),
    coins: coins ? coins : generateCoins(cell), // coins holds a memento check. if empty, make new coins array
    message: document.createElement("div"),
    popup: () => {
      cache.marker.addTo(map);
      neighborhood.rectArray.push(cache.marker);

      cache.marker.bindPopup(() => {
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

// deterministically generated coins array
function generateCoins(cell: Cell) {
  const coordString = `${cell.i}:${cell.j}`;
  const amount = Math.floor(
    luck([cell.i, cell.j, COIN_LUCK_MOD].toString()) * 100,
  );
  const coins: string[] = [];
  for (let i = 1; i <= amount; i++) {
    const coin = `${coordString}#${i}`;
    coins.push(coin);
  }

  return coins;
}

//  > helper function(s) (cache)
function cacheButtonsHandler(cache: Cache, buttons: HTMLButtonElement[]) {
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
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

      const cacheValue = cache.message.querySelector<HTMLSpanElement>(
        "#value",
      )!;
      const playerValue = player.message.querySelector<HTMLSpanElement>(
        "#value",
      )!;
      const playerInventory = statusBar?.querySelector<HTMLSpanElement>(
        "#value",
      )!;

      cacheValue.innerHTML = cache.coins.length.toString();
      playerValue.innerHTML = player.coins.length.toString();
      playerInventory.innerHTML = arrayToString(player.coins);
    });
  });
}

function arrayToString(array: string[]) { // TODO: make ui look nicer
  let result = "";
  array.forEach((elem) => {
    result = `${result} ${elem}`;
  });
  return result;
}
