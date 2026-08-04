# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Homebridge plugin (`homebridge-eveatmo`) that exposes a Netatmo Weatherstation and/or Indoor Air Quality monitor as HomeKit accessories, mimicking the look and feel of Elgato Eve Room/Weather devices (custom Eve characteristics, Eve history via `fakegato-history`) rather than using stock HomeKit sensor services.

Plain JavaScript (CommonJS, `require`/`module.exports`), not TypeScript, despite `typescript`/`typescript-eslint` being devDependencies — those are only used to power the ESLint flat config's type-aware rules.

## Commands

```bash
npm run lint     # eslint . --max-warnings=0
npm run fix      # eslint . --max-warnings=0 --fix
npm test         # node --test
```

There is no build step. Tests use Node's built-in `node:test` runner against the real `@homebridge/hap-nodejs` (no hand-built HAP stub) — see `test/` (mirrors `device/`/`accessory/` source layout) and `test-helpers/` (shared bootstrap; deliberately kept outside any directory named `test`, since `node --test`'s default discovery recursively treats every `.js` file under a `test/`-named directory as a test file). CI (`.github/workflows/build.yml`) runs `npm install` + `npm run lint` + `npm test` on Node 20.x/22.x/24.x for pushes to `master`/`develop` and PRs.

To manually exercise the plugin without a real Netatmo account, set `"mockapi": "eveatmo"` in the platform config — this routes API calls to `lib/netatmo-api-mock.js`, which reads fixture JSON from `mockapi_calls/*-<mockapi value>.json` (falls back to `*-default.json` if the named fixture is missing).

## Architecture

Everything is wired together through `homebridge`'s `hap` object, which is only available once Homebridge calls the plugin's export function. Because of this, almost every file in this repo follows the same shape:

```js
module.exports = function (pHomebridge) {
  if (pHomebridge && !homebridge) {
    homebridge = pHomebridge;
    // require() sibling modules here, passing `homebridge` through
  }
  class Something extends SomeHapClass { ... }
  return Something;
};
```

Modules are required and instantiated lazily inside constructors/builders (not at top-level) specifically so `homebridge.hap.*` classes exist before they're subclassed. When adding a new accessory/service, follow this same factory-function pattern rather than requiring `homebridge.hap` at module load time.

### Layers (top to bottom)

1. **`index.js`** — registers the `eveatmo` platform. `EveatmoPlatform` validates config (`auth` block, `grant_type`), constructs the Netatmo API client (real or mock), and in `accessories()` fans out to one "device type" per enabled feature (`weatherstation`, `airquality`) via `async.parallel`, retrying once after 30s on failure.

2. **`lib/netatmo-api.js`** — hand-maintained, promise-free (callback + EventEmitter) client for the Netatmo REST API (axios under the hood). Handles both `refresh_token` and deprecated `password` OAuth grants; persists refreshed tokens to `<homebridge-storage>/netatmo-token.json` and proactively refreshes 5 minutes before expiry. This file is a maintained fork of the abandoned `netatmo` npm package — treat API surface changes here as intentional, not accidental duplication. `lib/netatmo-api-mock.js` is a drop-in replacement with the same method names, backed by static fixtures.

3. **`device/*-device.js`** (`WeatherstationDeviceType`, `AirQualityDeviceType`) — extend `lib/netatmo-device.js`'s `NetatmoDevice` base class. Each owns a `NodeCache` (TTL from config, min 300s) for the raw Netatmo device map, a `setInterval` poll loop that pushes fresh data to all built accessories, and a `buildAccessory(deviceData)` factory that maps a Netatmo module `type` string (e.g. `NAMain`, `NAModule1`) to an accessory class. Whitelist/blacklist filtering by device ID happens here in `buildAccessories()`.

4. **`accessory/*-accessory.js`** (Room, Weather, Rain, Wind) — extend `lib/netatmo-accessory.js`'s `NetatmoAccessory` (itself a `homebridge.hap.Accessory` subclass). Each builds its own set of HAP services in `buildServices()`, tracks the latest sensor values as plain instance properties, and implements `notifyUpdate(deviceData, force)` to map raw Netatmo `dashboard_data` fields into those properties and push changes to services via `updateCharacteristics()`. Also owns a `fakegato-history` service instance for Eve app history graphs.

5. **`service/*.js`** — one file per HAP service/characteristic group (temperature, humidity, CO2, battery, noise, rain, wind, pressure, room air quality). Each is a `homebridge.hap.Service` subclass wired to its owning accessory; `get` handlers read from the accessory's cached properties (triggering a `refreshData()` call), and `updateCharacteristics()` pushes accessory state into HAP characteristics after a data refresh.

### Data flow

Netatmo API → `device/*` (cache + poll timer) → `accessory/*.notifyUpdate()` (maps `dashboard_data` → instance fields, records fakegato history entry) → `service/*.updateCharacteristics()` (pushes fields into HAP characteristics). Reads (HomeKit `get` on a characteristic) go the other way: `service.getX()` → `accessory.refreshData()` → `device.refreshDeviceData()` (serves from cache unless forced/expired).

### Config-driven behavior worth knowing

- `weatherstation` / `airquality` toggle which device types load at all (`index.js#loadDevices`).
- `extra_aq_sensor` / `extra_co2_sensor` add optional extra HAP services on room accessories (`accessory/eveatmo-room-accessory.js#buildServices`).
- `module_suffix`: when set, accessory names use `<module name> <suffix>` instead of `<station name> <module name>`, to dodge HomeKit's rejection of invalid characters sometimes present in Netatmo station names.
- `whitelist` / `blacklist`: arrays of Netatmo device/module MAC-like IDs; enforced in `lib/netatmo-device.js#buildAccessories`. A non-empty whitelist excludes everything not listed.
- `ttl`: poll interval in seconds, clamped to a 300s minimum (the station itself only samples every 5 minutes).

## Style

ESLint (flat config, `eslint.config.js`) enforces: single quotes, 2-space indent, required semicolons, Unix line endings, trailing commas on multiline, `curly: all`, `eqeqeq: smart`, max line length 200 (warning). Run `npm run fix` before committing to auto-fix most violations; `npm run lint` must pass with zero warnings for CI to go green.
