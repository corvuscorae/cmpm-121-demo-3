# cmpm-121-demo-3

## Credits!
Map library: [Leaflet](https://leafletjs.com/)
Map background: [OpenStreetMap](http://www.openstreetmap.org/copyright)

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
- [ ] represent grid cells using a global coordinate system anchored at [Null Island](https://en.wikipedia.org/wiki/Null_Island) (0°N 0°E)
    - the cell for the Oakes College classroom site would be {i: 369894, j: -1220627}.
- [ ] refactor conversion of lat-lng pairs into game cells
    - USE FLYWEIGHT PATTERN
- [ ] give coins an ID attribute
- [ ] base coin IDs on the coords of the cache it was originally spawned in
- [ ] each coin ID should be unique
    - example: {i: 369894, j: -1220627, serial: 0}
    - example: {i: 369894, j: -1220627, serial: 1}
- [ ] show user the coin IDs as strings
    - example: “369894:-1220627#0”
    - example: “369894:-1220627#1”


### just for fun
- [ ] let player pick/customize avatar 