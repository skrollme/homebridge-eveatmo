[![npm](https://img.shields.io/npm/v/homebridge-eveatmo.svg?style=plastic)](https://www.npmjs.com/package/homebridge-eveatmo)
[![npm](https://img.shields.io/npm/dt/homebridge-eveatmo.svg?style=plastic)](https://www.npmjs.com/package/homebridge-eveatmo)
[![GitHub last commit](https://img.shields.io/github/last-commit/skrollme/homebridge-eveatmo.svg?style=plastic)](https://github.com/skrollme/homebridge-eveatmo)

# homebridge-eveatmo

This is a [homebridge](https://github.com/nfarina/homebridge) plugin which lets you integrate your non-HomeKit Netatmo Weatherstation into HomeKit.

Whilst the original [homebridge-netatmo](https://github.com/planetk/homebridge-netatmo)-plugin goes a mostly HomeKit-standard approach (predefined services, characteristics, ...), this plugin tries to mimic the Elgato Eve devices (currently *Room* and *Weather*) as close as possible. 

## hint
**Because this is a work-in-progress project which is neither feature-complete nor fully testet this readme is more of a stub. Use at your own risk.**

## configuration
Because this plugin's base was taken from [homebridge-netatmo](https://github.com/planetk/homebridge-netatmo) (see above) you can adapt its config. Just use the plattform-code "eveatmo" and remove "ttl" and/or the other "refresh_" properties for the beginning.

```
"platforms": [
        {
            "platform": "eveatmo",
            "name": "eveatmo platform",
            "extra_co2_sensor": false,
            "ttl": 540,
            "auth": {
    	        "client_id": "XXXXX Create at https://dev.netatmo.com/",
                "client_secret": "XXXXX Create at https://dev.netatmo.com/",
                "username": "your netatmo username",
                "password": "your netatmo password"
            }
        }
    ],

```

- **extra_co2_sensor:** Adds an extra CO2 sensor which is available via Apple's stock Home.app, too.
- **ttl:** Seconds between two Netatmo API polls. Lower is not neccessarily better! The weatherstation itself collects one value per 5minutes, so going below 300s makes no sense
- **auth:** Credentials for the Netatmo API

### retrieve client id and secret

1. Register at http://dev.netatmo.com as a developer
2. After successful registration create your own app by using the menu entry "CREATE AN APP"
3. On the following page, enter a name for your app. Any name can be chosen. All other fields of the form (like callback url, etc.) can be left blank.
4. After successfully submitting the form the overview page of your app should show client id and secret.

## history

### 0.3.2
- Added a lower limit (300s) to prevent "overpolling" the Netatmo API

### 0.3.1
- Added missing update for custom AirQuality CO2 Characteristic, which also should deal with a duplicate CO2 display. If you still see multiple CO2-Sensors per device check your config for "extra_co2_sensor" and consider disabling this. This switch main purpose is to add an extra characteristic for the stock Home.app.

### 0.3.0
- First working version with support for the history of Eve.app
- Simplified polling which now defaults to a 9 minute interval. Polling/caching still needs some more finetuning. Please let me know if you see to many "Loading new data from API..." log-entries.

### 0.2.12
- Simplified and fixed backround-refreshing from API. "refresh_check_rate" was removed, internal polling is handled by "refresh_run_rate" (default 20s) and "ttl" (540s = 9min). Also fixed a bug which caused way too frequent api-calls which could lead to softbans (and an unresponsive homebridge).

### 0.2.10 & 0.2.11
- Resolved [Issue #7](https://github.com/skrollme/homebridge-eveatmo/issues/7): Marked Eve's custom characteristics as hidden + some defaults for refreshtimings / ttl

### 0.2.9
- Resolved [Issue #5](https://github.com/skrollme/homebridge-eveatmo/issues/5): Added configswitch (see config sample above) which adds an additional default-homekit _Carbon Dioxide Sensor_ for notifications

### 0.2.6 & 0.2.7 & 0.2.8
- Removed L2 caching because it did not work as expected. Instead the polling interval was reduced to 5min and the default cache ttl was set to match the intervall >> less force-refreshes (which cause duplicate apicalls)

### 0.2.5
- Added L2-Caching to prevent multiple calls to netatmo-API on multi-accessory-refresh

### 0.2.4
- Removed specific return-value from custom-characteristic, which seems to trigger firmware-update notice in EVE.app

### 0.2.3
- Refactoring/Renaming (could break exisiting setups, so remove and re-add as new devices).
- Switched room-device's main service to AirQualitySensor and added CO2-Characteristic. This should default Home.app let recognize it as supported sensor

### 0.2.2
- Removed some homebridge-logspammer (sorry)

### 0.2.1
- Added rain-accessory (if present at netatmo station)

### 0.2.0
- Added temperature/humidity sensors as separate services to be recognized by default home.app

### 0.1.0
- Initial working state which was adapted (copied) from homebridge-netatmo

## todos
- <del>maybe refactoring to split characterstics into separate services (better functionality in Apple's default home.app)</del>
- reintegrate <del>rain-sensor and</del> wind-sensor and thermostat
- <del>adding CO2 [ppm] or maybe just "CO2 detected" to indoor devices</del>
- researching/testing/implementing Eve's history-functionality (see: [https://gist.github.com/0ff/668f4b7753c80ad7b60b](https://gist.github.com/0ff/668f4b7753c80ad7b60b))

## thanks

This plugin's basic structure and most of its basic code is a fork (ok, lets say "copy") of [homebridge-netatmo](https://github.com/planetk/homebridge-netatmo). So big thanks to @planetk and all the other contributors of this project. 

Also big thanks to @gomfunkel and @simont77 for [this gist](https://gist.github.com/gomfunkel/b1a046d729757120907c) and its [fork](https://gist.github.com/simont77/3f4d4330fa55b83f8ca96388d9004e7d), @KhaosT for [this gist](https://gist.github.com/KhaosT/e365acfd589ce840a403), @mplewis for [this gist](https://gist.github.com/mplewis/def678dc4b6e63a86905) and @0ff for [this (almost) working Eve Weather imitating homebridge-plugin](https://gist.github.com/0ff/668f4b7753c80ad7b60b) and once again special thanks to @simont77 for his endurance in digging deeper in Eve's custom characteristics and its protocols.

## what else

Like this? Please buy me a beer :beers: ...

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.me/skroll)

Cheers go to:
- @DJay79 (x2)
- s.k**********r@aon.at



