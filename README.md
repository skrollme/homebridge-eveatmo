[![npm](https://img.shields.io/npm/v/homebridge-eveatmo.svg?style=plastic)](https://www.npmjs.com/package/homebridge-eveatmo)
[![npm](https://img.shields.io/npm/dt/homebridge-eveatmo.svg?style=plastic)](https://www.npmjs.com/package/homebridge-eveatmo)
[![GitHub last commit](https://img.shields.io/github/last-commit/skrollme/homebridge-eveatmo.svg?style=plastic)](https://github.com/skrollme/homebridge-eveatmo)

# homebridge-eveatmo

This is a [homebridge](https://github.com/nfarina/homebridge) plugin which lets you integrate your non-HomeKit Netatmo Weatherstation and Indoor Air Quality monitor into HomeKit.

Whilst the original [homebridge-netatmo](https://github.com/planetk/homebridge-netatmo)-plugin goes a mostly HomeKit-standard approach (predefined services, characteristics, ...), this plugin tries to mimic the Elgato Eve devices as close as possible. 

# :rotating_light: Warning
Since Netatmo announced a change to their authentification-policies it was also necessary to update this plugin's authentication-mechanism. 
**From 1.0.0 on it does not accept authentication via user-credentials anymore so you have to adapt your existing setup!** 
You need to generate a refresh-token in your app's page at dev.netatmo.com instead.
For more details see the instructions below or take a look at this issue: https://github.com/skrollme/homebridge-eveatmo/issues/62

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
            "weatherstation": true,
            "airquality": false,
            "ttl": 540,
            "auth": {
    	        "client_id": "XXXXX Create at https://dev.netatmo.com/",
                "client_secret": "XXXXX Create at https://dev.netatmo.com/",
                "refresh_token": "a valid refresh token for the given client_id",
            }
        }
    ],

```

- **weatherstation** Enables support for Netatmo's WeatherStation. Default value is *true*
- **airquality** Enables support for Netatmo's Indoor Air Quality monitor. Default value is *false*
- **extra_co2_sensor: (optional)** Adds an extra CO2 sensor which is available via Apple's stock Home.app, too. Default value is *false*
- **co2_alert_threshold (optional):** Sets the co2-level [ppm] at which the sensors switch to alert-state
- **ttl: (optional)** Seconds between two Netatmo API polls. Lower is not neccessarily better! The weatherstation itself collects one value per 5minutes, so going below 300s makes no sense. Default value is *540* (=9min)
- **auth:** Credentials for the Netatmo API (see below)
- **module_suffix: (optional)** If this is set, the Netatmo's devicename will not be prepended to the modulename. Instead this config-value will be appended - with a space - to the module name 

###  Control Accessories by device ID

Controlling devices can be done on a finer level by id. The id of a netatmo device or module basically is it's mac address.

In order to include or exclude a specific device, the corresponding id can be included in a whitelist resp. blacklist.

If the whitelist contains at least one entry, all other ids will be excluded.

<pre>

    "platforms": [
        {
            "platform": "eveatmo",
            
            ...
            
            <b>"whitelist": [
              "aa:bb:cc:11:22:33"
            ],
            "blacklist": [
              "01:02:03:04:05:06",
              "01:23:45:67:89:ab"
            ],</b>

            ...
            
        }
    ],

</pre>

### Retrieve _client_id_, _client_secret_ and _refresh_token_

1. Register at http://dev.netatmo.com as a developer
2. After successful registration create your own app by using the menu entry "CREATE AN APP"
3. On the following page, enter a name for your app. Any name can be chosen. All other fields of the form (like _callback_url_, etc.) can be left blank.
4. After successfully submitting the form the overview page of your app should show _client_id_ and _client_secret_.
5. Do an initial auth with the newly created app via the "Token generator" on your app's page https://dev.netatmo.com/apps/ to get a _refresh_token_
6. Add the _client_id_, the _client_secret_ and the _refresh_token_ to the config's _auth_-section
7. The plugin will use the _refresh_token_ from the config to retrieve and refresh _auth_tokens_. It will also store newly retrieved tokens in a file (_netatmo-token.js_) in your homebridge config directory. If you delete the _netatmo-token.js_ file, you may have to regenerate a new _refresh_token_ like in step 5) if your initial _refresh_token_ (from the _config.json_) already has expired
 
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

## Thanks and disclaimer

This plugin's basic structure and most of its basic code is a fork (ok, lets say "copy") of [homebridge-netatmo](https://github.com/planetk/homebridge-netatmo). So big thanks to @planetk and all the other contributors of this project. 

Also big thanks to @gomfunkel and @simont77 for [this gist](https://gist.github.com/gomfunkel/b1a046d729757120907c) and its [fork](https://gist.github.com/simont77/3f4d4330fa55b83f8ca96388d9004e7d), @KhaosT for [this gist](https://gist.github.com/KhaosT/e365acfd589ce840a403), @mplewis for [this gist](https://gist.github.com/mplewis/def678dc4b6e63a86905) and @0ff for [this (almost) working Eve Weather imitating homebridge-plugin](https://gist.github.com/0ff/668f4b7753c80ad7b60b) and once again special thanks to @simont77 for his endurance in digging deeper in Eve's custom characteristics and its protocols.

Thanks go also to the following direct contributors:
- @jason-klein (https://github.com/skrollme/homebridge-eveatmo/pull/28)
- @lisanet (https://github.com/skrollme/homebridge-eveatmo/pull/36)
- @foliveira (https://github.com/skrollme/homebridge-eveatmo/pull/52)
- @RyanHS7VM (https://github.com/skrollme/homebridge-eveatmo/pull/54)

**Since Netatmo announced some changes on what kind of authentication their API will support and I did not found a good solution to override the code of the [netatmo](https://github.com/karbassi/netatmo)-dependency to continue working, this module contains an altered full-copy of the module. All credits for the original code go to the respective authors.**

## What else

Like this and want to express your feelings? Please buy me a beer :beers: ...

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.me/skroll)

Cheers go to:
- @DJay79 2x:beers:
- s.k**********r@aon.at :beers:
- C. Schneider :beers:
- S. Eisenkrämer :beers:
- C. Kowalczyk :beers:



