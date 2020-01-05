[![npm](https://img.shields.io/npm/v/homebridge-eveatmo.svg?style=plastic)](https://www.npmjs.com/package/homebridge-eveatmo)
[![npm](https://img.shields.io/npm/dt/homebridge-eveatmo.svg?style=plastic)](https://www.npmjs.com/package/homebridge-eveatmo)
[![GitHub last commit](https://img.shields.io/github/last-commit/skrollme/homebridge-eveatmo.svg?style=plastic)](https://github.com/skrollme/homebridge-eveatmo)

# homebridge-eveatmo

This is a [homebridge](https://github.com/nfarina/homebridge) plugin which lets you integrate your non-HomeKit Netatmo Weatherstation into HomeKit.

Whilst the original [homebridge-netatmo](https://github.com/planetk/homebridge-netatmo)-plugin goes a mostly HomeKit-standard approach (predefined services, characteristics, ...), this plugin tries to mimic the Elgato Eve devices as close as possible. 

## Configuration
Because this plugin's base was taken from [homebridge-netatmo](https://github.com/planetk/homebridge-netatmo) (see above) you can adapt its config. Just use the plattform-code "eveatmo" and remove "ttl" and/or the other "refresh_" properties for the beginning.

You can also configure this plugin via [ConfigUI-X's settings](https://github.com/oznu/homebridge-config-ui-x/wiki/Developers:-Plugin-Settings-GUI) feature. 

```
"platforms": [
        {
            "platform": "eveatmo",
            "name": "eveatmo platform",
            "extra_co2_sensor": false,
            "co2_alert_threshold": 1000,
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

- **extra_co2_sensor: (optional)** Adds an extra CO2 sensor which is available via Apple's stock Home.app, too. Default value is *false*
- **co2_alert_threshold (optional):** Sets the co2-level [ppm] at which the sensors switch to alert-state
- **ttl: (optional)** Seconds between two Netatmo API polls. Lower is not neccessarily better! The weatherstation itself collects one value per 5minutes, so going below 300s makes no sense. Default value is *540* (=9min)
- **auth:** Credentials for the Netatmo API
- **module_suffix: (optional)** If this is set, the Netatmo's devicename will not be prepended to the modulename. Instead this config-value will be appended - with a space - to the module name 

### Retrieve client id and secret

1. Register at http://dev.netatmo.com as a developer
2. After successful registration create your own app by using the menu entry "CREATE AN APP"
3. On the following page, enter a name for your app. Any name can be chosen. All other fields of the form (like callback url, etc.) can be left blank.
4. After successfully submitting the form the overview page of your app should show client id and secret.

## Siri Voice Commands

Here are sample English voice commands:
- How cool is it in the ROOM NAME?
- How warm is it in the ROOM NAME?
- How humid is it in the ROOM NAME?
- What's the temperature in my ROOM NAME?
- What's the humidity in my ROOM NAME?
- What's the air quality in my ROOM NAME?
- What's the CO2 level in my ROOM NAME?
- What's the carbon dioxide level in my ROOM NAME?

Siri understands variations of each command:
- What's the temperature ROOM NAME?
- What's the temperature in ROOM NAME?
- What's the temperature in my ROOM NAME?
- What's the temperature in the ROOM NAME?
- What's the temperature down in my ROOM NAME?
- What's the temperature down in the ROOM NAME?

Siri voice commands may vary by language. Since this plugin tries to mimic the Elgato Eve devices, you can search the Eve blog for articles listing voice commands in your language.

Blog posts with English commands:
- https://blog.evehome.com/fun-with-siri/
- https://blog.evehome.com/tip-siri-names/

Blog posts with German commands:
- https://blog.evehome.com/de/spass-mit-siri/
- https://blog.evehome.com/de/tipp-siri-namen/

## History

see [HISTORY.md](https://github.com/skrollme/homebridge-eveatmo/blob/master/HISTORY.md)

## ToDos
- <del>maybe refactoring to split characterstics into separate services (better functionality in Apple's default home.app)</del>
- reintegrate <del>rain-sensor, wind-sensor and</del> thermostat
- <del>adding CO2 [ppm] or maybe just "CO2 detected" to indoor devices</del>
- <del>researching/testing/implementing Eve's history-functionality (see: [https://gist.github.com/0ff/668f4b7753c80ad7b60b](https://gist.github.com/0ff/668f4b7753c80ad7b60b))</del>
- <del>Make CO2 trigger threshold configurable (see: https://github.com/skrollme/homebridge-eveatmo/issues/24)</del>


## Thanks

This plugin's basic structure and most of its basic code is a fork (ok, lets say "copy") of [homebridge-netatmo](https://github.com/planetk/homebridge-netatmo). So big thanks to @planetk and all the other contributors of this project. 

Also big thanks to @gomfunkel and @simont77 for [this gist](https://gist.github.com/gomfunkel/b1a046d729757120907c) and its [fork](https://gist.github.com/simont77/3f4d4330fa55b83f8ca96388d9004e7d), @KhaosT for [this gist](https://gist.github.com/KhaosT/e365acfd589ce840a403), @mplewis for [this gist](https://gist.github.com/mplewis/def678dc4b6e63a86905) and @0ff for [this (almost) working Eve Weather imitating homebridge-plugin](https://gist.github.com/0ff/668f4b7753c80ad7b60b) and once again special thanks to @simont77 for his endurance in digging deeper in Eve's custom characteristics and its protocols.

Thanks go also to the following direct contributors:
- @jason-klein (https://github.com/skrollme/homebridge-eveatmo/pull/28)
- @lisanet (https://github.com/skrollme/homebridge-eveatmo/pull/36)

## What else

Like this and want to express your feelings? Please buy me a beer :beers: ...

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.me/skroll)

Cheers go to:
- @DJay79 2x:beers:
- s.k**********r@aon.at :beers:
- C. Schneider :beers:
- S. Eisenkrämer :beers:
- C. Kowalczyk :beers:



