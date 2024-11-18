// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet, { LatLng, Marker, Rectangle } from "leaflet";
import luck from "./luck.ts";
import { Board, Cell } from "./board.ts";

// style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// data to store: player location and coins and neighborhood ///////////////////////
const deleteLocalMemory = {
  button: document.createElement("button"),
  init: () => {
    deleteLocalMemory.button.innerHTML = "🚮";
    deleteLocalMemory.button.classList.add("panelButton");
    movementButtons!.appendChild(deleteLocalMemory.button);
  },
};
deleteLocalMemory.button.addEventListener("click", () => {
  localStorage.clear();
});

//* DEBUG TOOLBOX *//
const DEBUG = {
  ALLOW_ZOOM: true,
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

interface PersistantPlayerData {
  location: LatLng;
  coins: string[];
}

interface Player {
  data: PersistantPlayerData;
  avatar: Marker;
  message: HTMLDivElement;
  tooltip(): void;
  init(): void;
}

//* MEMORY *//
// cache memento configuration inspired by Anthony Nguyen's memento class
// https://github.com/Mapeggs/cmpm-121-demo-3/blob/main/src/main.ts
function cacheMemento(init: Map<string, string[]>) {
  const state = init;

  function restore(key: string): string[] | null {
    return state.has(key) ? state.get(key)! : null;
  }

  function save(key: string, coins: string[]) {
    state.set(key, coins);
  }

  function toString(): string {
    const obj: { [key: string]: string[] } = {};
    state.forEach((value, key) => {
      obj[key] = value;
    });
    return JSON.stringify(obj);
  }

  return { restore, save, toString };
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

const player: Player = {
  data: getPlayerData(),
  avatar: leaflet.marker(INIT_LOCATION, { icon: myIcon }),
  message: document.createElement("div"),
  tooltip: () => {
    player.message.innerHTML =
      `you have <span id="value">${player.data.coins.length}</span> coins`;
    return player.avatar.bindTooltip(player.message, {
      offset: [ICON_WIDTH / 2, 0],
    });
  },
  init: () => {
    player.avatar.addTo(map);
    player.tooltip();
    updatePlayerData(0, 0);
  },
};

function getPlayerData() {
  const init = localStorage.getItem("player");
  let data: PersistantPlayerData;
  if (!init) {
    data = {
      location: INIT_LOCATION,
      coins: <string[]> [],
    };
  } else data = JSON.parse(init);
  return data;
}

const statusBar = document.getElementById("statusbar");

const movementButtons = document.getElementById("controlPanel");
deleteLocalMemory.init();

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
  movementButtons!.appendChild(newButton.button);
});

buttons.forEach((b) => {
  b.button.addEventListener("click", () => {
    switch (b.direction) {
      case "🔼": // move up
        updatePlayerData(0, CELL_WIDTH);
        break;
      case "🔽": // move down
        updatePlayerData(0, -CELL_WIDTH);
        break;
      case "◀️": // move left
        updatePlayerData(-CELL_WIDTH, 0);
        break;
      case "▶️": // move right
        updatePlayerData(CELL_WIDTH, 0);
        break;
      default:
        break;
    }
  });
});

const geolocate = {
  toggle: document.createElement("input"),
  watchID: -1,
  init: () => {
    geolocate.toggle.type = "checkbox";
    geolocate.toggle.name = "geoToggle.switch";
    const label = document.createElement("label");
    label.htmlFor = "geoToggle.switch";
    label.appendChild(document.createTextNode("🌐"));

    movementButtons!.appendChild(label);
    movementButtons!.appendChild(geolocate.toggle);
  },
  listener: () => {
    geolocate.toggle.addEventListener("change", () => {
      if (geolocate.toggle.checked) {
        buttons.forEach((b) => {
          b.button.disabled = true;
        });
        geolocate.watchID = navigator.geolocation.watchPosition((p) => {
          const latOffset = p.coords.latitude - player.data.location.lat;
          const lngOffset = p.coords.longitude - player.data.location.lng;
          updatePlayerData(lngOffset, latOffset);
        });
      } else {
        buttons.forEach((b) => {
          b.button.disabled = false;
        });
        navigator.geolocation.clearWatch(geolocate.watchID);
      }
    });
  },
};
geolocate.init();
geolocate.listener();

function updatePlayerData(lng: number, lat: number) {
  player.data.location.lng += lng;
  player.data.location.lat += lat;

  player.avatar.setLatLng(player.data.location);
  map.setView(player.data.location);
  regenerateCaches(player.data.location);

  localStorage.setItem("player", JSON.stringify(player.data));
}

//* GRID *//
const board: Board = new Board(CELL_WIDTH, NEIGHBORHOOD_SIZE);

const getNeighborhood = localStorage.getItem("neighborhood");
const initMem = (!getNeighborhood)
  ? new Map<string, string[]>()
  : mapFromString(getNeighborhood!);
function mapFromString(data: string) {
  const parsedMap = JSON.parse(data);
  const result = new Map<string, string[]>();
  for (const key in parsedMap) {
    result.set(key, parsedMap[key]);
  }
  return result;
}
const neighborhood = {
  cacheArray: <Cache[]> [],
  rectArray: <Rectangle[]> [],
  caretaker: cacheMemento(initMem),
};

function remember(
  // deno-lint-ignore no-explicit-any
  memory: any,
  key: string,
  data: string[],
  localStorageKey?: string,
) {
  memory.save(key, data); // update memento
  if (localStorageKey) localStorage.setItem(localStorageKey, memory.toString());
}

function regenerateCaches(p: LatLng) {
  const neighborCell: Cell[] = board.getCellsNearPoint(p);

  neighborhood.cacheArray.forEach((cache) => {
    const neighborString = JSON.stringify(cache.cell);
    remember(
      neighborhood.caretaker,
      neighborString,
      cache.coins,
      "neighborhood",
    );
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
      const mem = neighborhood.caretaker.restore(neighborString); // check for memento
      neighborhood.cacheArray.push(makeCache(neighbor, mem!));
    }
  });
  //  > put caches on map
  neighborhood.cacheArray.forEach((cache) => {
    cache.popup();
  });
}
regenerateCaches(player.data.location);

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
      const availableCoins = (button.id === "collect")
        ? cache.coins.length
        : player.data.coins.length;
      if (availableCoins > 0) {
        switch (button.id) {
          case "collect":
            player.data.coins.push(cache.coins.pop()!);
            break;
          case "deposit":
            cache.coins.push(player.data.coins.pop()!);
            break;
          default:
            break;
        }
      }
      remember(
        neighborhood.caretaker,
        JSON.stringify(cache.cell),
        cache.coins,
        "neighborhood",
      );

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
      playerValue.innerHTML = player.data.coins.length.toString();
      playerInventory.innerHTML = arrayToString(player.data.coins);
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

player.init();
