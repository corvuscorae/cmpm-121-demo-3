# Geocoin Carrier
### cmpm-121-demo-3

## Credits!
- Map library: [Leaflet](https://leafletjs.com/)
- Map background: [OpenStreetMap](http://www.openstreetmap.org/copyright)
- Cache memento configuration inspired by Anthony Nguyen's [memento class](https://github.com/Mapeggs/cmpm-121-demo-3/blob/main/src/main.ts)

## Next steps!

### D3.a
- [x] draw map to webpage
- [x] implement a latitude–longitude grid where cells are 0.0001 degrees wide
- [x] add a player marker
- [x] deterministically generated cache locations around initial location
    - cache should be at 10% of the grid cells that are within 8 cell-steps away from the player’s current location
- [x] deterministically generated coins offered at each location
- [x] player location represented with a tooltip/popup
- [x] nearby cache locations represented with popups
- [x] add buttons to cache location popups...
- [x] ...so player can transport coins from one cache to another by collecting and depositing coins (using those buttons in pop up!)

### D3.b
- [x] represent grid cells using a global coordinate system anchored at [Null Island](https://en.wikipedia.org/wiki/Null_Island) (0°N 0°E)
    - the cell for the Oakes College classroom site would be {i: 369894, j: -1220627}.
- [x] refactor conversion of lat-lng pairs into game cells
    - USE FLYWEIGHT PATTERN
- [x] give coins an ID attribute
- [x] base coin IDs on the coords of the cache it was originally spawned in
- [x] each coin ID should be unique
    - example: {i: 369894, j: -1220627, serial: 0}
    - example: {i: 369894, j: -1220627, serial: 1}
- [x] show user the coin IDs as strings
    - example: “369894:-1220627#0”
    - example: “369894:-1220627#1”

### D3.c
- [x] arrows for player movement
    - movement buttons move the player’s location with the same cell-granularity used by other aspects of the game (e.g. 0.0001 degrees at a time).
- [x] Regenerate cache locations as the player moves so that only locations sufficiently close to their position are visible on the map
- [x] Using the Memento pattern save the state of caches so that their contents is preserved even when the player moves out of view and back

### D3.d
- [ ] Allow the player to turn on automatic position updating based on their device’s current geolocation (pressing the 🌐 button).
- [ ] Use a persistent data storage mechanism to allow the player to continue a gameplay session even after they have closed the game’s browser window.
- [ ] Use a polyline to render the player’s movement history.
- [ ] Allow the player to reset the game’s state (pressing the 🚮button), effectively returning all coins to their home caches and erasing their (potentially sensitive) location history.

### just for fun
- [ ] let player pick/customize avatar 
- [ ] let play pick exactly which coin to take from a cache
- [ ] implement exquisite cache (exquisite corpse) OR refrigerator magnets style of gameplay