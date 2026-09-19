# Sky Plane

A single-player airport business game with a low-poly 3D flight simulator. Built with plain HTML, CSS, and JavaScript. No installation, build step, accounts, dependencies, downloads, tracking, or backend is required to play.

## Play

Open **index.html** in a modern browser. Or, if Node.js is installed, run:

```
node server.js
```

Then open http://127.0.0.1:4173. Start with **Flight school** in the sidebar. **Your first flight** opens a guided mission briefing.

## Host anywhere

Upload these six files together to any static web host, retaining their names:

```
index.html
style.css
core.js
worlds.js
world.js
app.js
```

There are no absolute asset paths, remote fonts, CDNs, API keys, databases, or server-side requirements. The game can live in a subfolder. The optional server is for local preview, not a production hosting requirement. Use your school's permitted hosting and browser arrangements.

## Worlds and play modes

Every world is created with a name, a play mode, and a world type. Mode and type are locked once the world exists; you can keep as many worlds as you like and switch between them from the main menu.

| Play mode | What it is |
| --- | --- |
| **Airport business** | Run the airport: buildings, staff, finances, roles, and every mission. |
| **Flight only** | A fully equipped airport and every mission, with no money, wages, or management. |
| **Competitive** | A time trial. One track, one timer, no missions or business. Finish the race to set a record; beating it saves a new one. Once you have a record, a translucent **ghost aircraft** flies your best lap beside you and each gate shows how far ahead or behind you are. |
| **Free flight** | All twenty islands generated in one open world around your home island, no missions, no timer, no business. Touch down on any runway and your tanks fill without the flight ending; take off again and keep exploring. |

### Flying between islands

In business and flight-only worlds the passenger, cargo, and emergency missions are **crossings**: the game generates your island plus one random other island 10–12 km away and routes you across the water into a proper approach on its runway 36 (the route steers around high ground automatically). Training, the air rally, and the coastline patrol remain circuits around the island you are on.

- **Flight only:** after landing you are parked on that island. Your next flights start there — circuits fly around it, crossings go on to yet another island — and a **Homeward bound** flight on the mission list takes you back to your own island.
- **Business:** you only fly out; the next flight always starts back at your own airport.

There are **20 maps** in four world types, five per type. Every map has its own landmasses, mountains or mesas, vegetation, airport setting, and a distinct race circuit with its own default track. The runway is always runway 36 and the flight rules never change.

| World type | Maps |
| --- | --- |
| **Island** | Seabreeze Island (bay circuit), Crescent Atoll (loop over the lagoon), Longshore Peninsula (slalom along the spine), Twin Harbours (figure-eight across the strait), Ember Peak (climbing spiral around a volcano) |
| **Desert** | Dunes & Mesas (bay circuit), Red Canyon (slalom between mesa walls), Palm Oasis (loop around the oasis), Salt Flats (fast figure-eight), Mesa Country (climbing spiral) |
| **Alpine** | Alpine Valley (bay circuit), Glacier Lake (loop over the lake), Ridge Run (valley slalom), Summit Circuit (climbing spiral), Highland Meadows (figure-eight) |
| **Arctic** | Polar Outpost (bay circuit), Frozen Fjord (fjord slalom), Ice Shelf (figure-eight), Glacier Bay (loop between icebergs), Aurora Peak (climbing spiral under violet skies) |

**Design a race** still lets you change the number of gates, size, altitude, and direction of any map's circuit; the shape stays true to the map. Choosing *right* mirrors loops and spirals to the other side of the field.

## What you can do

- Run an airport with a $24,000 starting investment, employee wages, upkeep, flight costs, ticket revenue, loans, grants, and a transaction ledger.
- Expand terminals, hangars, runway length, radar, fuel storage, and emergency facilities. Each expansion changes the economy or flight rewards and adds to the 3D airport.
- Hire and dismiss staff. Flights pass through check-in, security, ground handling, and boarding. Missing staff create real bottlenecks.
- Switch between manager, pilot, check-in receptionist, security guard, cabin crew, ground crew, and engineer. Service roles have rotating interactive tasks; correct answers pay bonuses and relevant tasks advance waiting flights.
- Fly training, passenger, fragile cargo, unarmed military patrol, medical-delivery, and time-trial racing missions. Follow navigation gates, land on runway 36 (yours or a neighbouring island's), and brake to collect the mission reward.
- Choose aircraft paint, clear skies, overcast, storms, or golden hour; design a race route; switch between chase, cockpit, and cinematic cameras; watch a replay of the last 60 seconds.
- Read eight tutorial lessons plus a full controls guide.
- Save locally and export/import JSON backups to move your airport between computers.

## Flight controls

| Control | Action |
| --- | --- |
| W / Up arrow | Nose down |
| S / Down arrow | Nose up |
| A / D or Left / Right | Bank |
| Q / E | Rudder / ground steering |
| + / Shift | Increase throttle |
| − / Ctrl | Decrease throttle |
| F | Cycle flaps: 0°, 15°, 30° |
| G | Landing gear |
| B | Wheel brakes |
| C | Change camera |
| Esc / P | Pause |

Takeoff: select 15° flaps, full throttle, rotate gently at 65–70 knots. Retract gear above 100 ft and raise flaps once climbing. Landing: gear down, 30° flaps, 65–80 knots, level wings, gentle descent. Reduce throttle and brake after touchdown.

Pitch controls can be reversed. Touch controls appear on narrow screens and can be forced on in Settings.

## Performance and saves

Low graphics is the default. It uses reduced rendering resolution and distant details with a 30 FPS cap. Medium uses full resolution at 30 FPS; High increases resolution and caps at 60 FPS. Flight simulation always uses a fixed 60 Hz step, independent of graphics quality.

One real minute is one game hour. Employees work during missions and other pages. Simulation pauses while the browser tab is hidden, while a dialog is open, during replays, or when explicitly paused. There are no offline charges.

The game autosaves to `localStorage` every 10 seconds and after important actions. Saves are per browser and origin. Incognito mode, school policies, and browser cleanup may remove them: **export a backup before leaving**. Flights in progress and replay footage are not persisted; the business and completed rewards are.

## Scope of this version

This is a playable small game, not an aviation training tool. The flight model approximates lift, drag, gravity, angle of attack, stalls, wind, flaps, gear, fuel, and reduced engine power. Passenger jets, cargo planes, patrol aircraft, rescue planes, and trainers have procedural visual variants. All share one simplified light-trainer physical model. It has no arcade physics toggle.

Airport building placement is predefined; upgrades grow a procedural island. Custom race courses are parameter-based and included in save exports, as is your race record (and, in competitive worlds, its ghost trace, about 50–100 KB for a full lap). Changing the course clears both. There is no full terrain editor, online community sharing service, walkable airport, combat, or multiplayer. Employee roles use interactive workstation tasks. Mountains, hills, and mesas are solid: flying into them ends the flight. Mission and race gates are always placed clear of the scenery (routes are lifted over high ground automatically), and each map's missions follow that map's own circuit. No external Blender assets are needed.

## Development and checks

`core.js` contains browser-independent economy and flight rules. `world.js` is a software 3D polygon renderer using Canvas 2D. `app.js` contains the interface, missions, roles, inputs, sound, replay, and persistence. No compilation is required.

Run the rules tests with Node.js 18 or newer:

```
npm test
```

This runs `core.test.js` (economy and flight rules), `worlds.test.js` (world library and saves), and `race.test.js` (play modes, all 20 maps and their races, island crossings, free flight, race records, and ghost traces).

The optional `browser.cjs` smoke test uses Playwright if available in your development environment. It is not needed to play or host the game.

`node flight-circuit.cjs` flies a complete training circuit using a test-only input controller. Pass a mission and difficulty to check other routes, for example `node flight-circuit.cjs emergency hard`. This controller is not an autopilot feature in the game. `portable.cjs` checks direct-file launching and save import/export in a browser.

