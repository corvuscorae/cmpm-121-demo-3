// deno-lint-ignore-file no-explicit-any
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
function remember(object: any, memory: any) {
  const newMem = memento(object);
  memory.addMemento(newMem);
}

function memento(init: any) {
  let state = init;

  function create() {
    return { state };
  }

  function restore(memento: any) {
    state = { memento };
  }

  function setState(newState: any) {
    state = { state, newState };
  }

  function getState() {
    return state;
  }

  return { create, restore, setState, getState };
}

function caretaker() {
  const mementos = new Map();

  function addMemento(id: any, memento: any) {
    mementos.set(id, memento);
  }

  function getMemento(query: any) {
    return mementos.get(query);
  }

  //function hasMemento(query: any){ return mementos.has(query); }

  return { addMemento, getMemento /*, hasMemento*/ };
}

//////////////////////////////////////////////////
//const idk = memento([1, 2, 3]);
//const history = caretaker();
//
////idk.setState([4, 5, 6])
//history.addMemento(idk.create());
//console.log("change 1:", idk.getState());
//
//idk.setState([7, 8, 9])
//console.log("change 2:", idk.getState());
//
//idk.restore(history.getMemento(0));
//console.log("restored:", idk.getState());
//////////////////////////////////////////////////

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

//document.createElement("button");

//* GRID *//
const board: Board = new Board(CELL_WIDTH, NEIGHBORHOOD_SIZE);

const neighborhood = {
  cacheArray: <Cache[]> [],
  rectArray: <Rectangle[]> [],
  memory: caretaker(),
};

function regenerateCaches(p: LatLng) {
  const neighborCell: Cell[] = board.getCellsNearPoint(p);

  neighborhood.cacheArray.forEach((cache) => {
    console.log(cache.coins);
    //const neighborString = JSON.stringify(cache); //
    //remember({id: neighborString, coins: cache.coins}, neighborhood.memory);
  });
  neighborhood.cacheArray = [];

  // TODO: only delete out of bounds caches
  neighborhood.rectArray.forEach((rect) => {
    map.removeLayer(rect);
  });

  neighborCell.forEach((neighbor) => {
    const i = neighbor.i;
    const j = neighbor.j;
    const roll = luck([i, j, CACHE_LUCK_MOD].toString());
    if (roll < SPAWN_PROBABILITY) {
      const neighborString = JSON.stringify(neighbor);
      const memento = neighborhood.memory.getMemento(neighborString);
      console.log(memento);
      if (!memento) {
        remember({ id: neighborString, object: [] }, neighborhood.memory);
        //////////////// remember id/coins array
        // --> LIKE THIS: const newMem = {id: id, object: neighbor.coin}
        //memento = memento();
      }
      neighborhood.cacheArray.push(makeCache(neighbor));
    }
  });

  //  > put caches on map
  neighborhood.cacheArray.forEach((cache) => {
    cache.popup();
  });
}
regenerateCaches(player.location);

//* CACHES *//
function makeCache(cell: Cell) {
  const cache: Cache = {
    cell: cell,
    marker: leaflet.rectangle(board.getCellBounds(cell)),
    coins: generateCoins(cell),
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

function generateCoins(cell: Cell) {
  const coordString = `${cell.i}:${cell.j}`;
  const amount = Math.floor(
    luck([cell.i, cell.j, COIN_LUCK_MOD].toString()) * 100,
  );
  const coins = [];
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
