# homebridge-eveatmo

This is a [homebridge](https://github.com/nfarina/homebridge) plugin which lets you integrate your non-HomeKit Netatmo Weatherstation into HomeKit.

Whilst the original [homebridge-netatmo](https://github.com/planetk/homebridge-netatmo)-plugin goes a mostly HomeKit-standard approach (predefined services, characteristics, ...), this plugin tries to mimic the Elgato Eve devices (currently *Room* and *Weather*) as close as possible. 

## hint
**Because this is a work-in-progress project which is neither feature-complete nor fully testet this readme is more of a stub and this plugin is not listed at [https://www.npmjs.com](https://www.npmjs.com) so far. Use at your own risk.**

## configuration
Because this plugin's base was taken from [homebridge-netatmo](https://github.com/planetk/homebridge-netatmo) (see above) you can adapt its config. Just use the plattform-code "eveatmo":

```
"platforms": [
        {
            "platform": "eveatmo",
            "name": "eveatmo platform",
            "ttl": 10,
            "auth": {
    	        "client_id": "XXXXX Create at https://dev.netatmo.com/",
                "client_secret": "XXXXX Create at https://dev.netatmo.com/",
                "username": "your netatmo username",
                "password": "your netatmo password"
            }
        }
    ],

```

### retrieve client id and secret

1. Register at http://dev.netatmo.com as a developer
2. After successful registration create your own app by using the menu entry "CREATE AN APP"
3. On the following page, enter a name for your app. Any name can be chosen. All other fields of the form (like callback url, etc.) can be left blank.
4. After successfully submitting the form the overview page of your app should show client id and secret.

### notes
- Do not reduce *ttl* further until you are testing/debugging. I recommend to use the mockup-api in this cases if you don't want to get soft-banned at the netatmo-API.


## todos
- maybe refactoring to split characterstics into separate services (better functionality in Apple's default home.app)
- trying to integrate rain-sensor and wind-sensor
- researching/testing/implementing Eve's history-functionality (see: [https://gist.github.com/0ff/668f4b7753c80ad7b60b](https://gist.github.com/0ff/668f4b7753c80ad7b60b))
- testing
	- overall functionality
	- multiple weatherstations

## thanks

This plugin's basic structure and most of its basic code is a fork (ok, lets say "copy") of [homebridge-netatmo](https://github.com/planetk/homebridge-netatmo). So big thanks to @planetk and all the other contributors of this project. 

Also big thanks to @gomfunkel and @simont77 for [this gist](https://gist.github.com/gomfunkel/b1a046d729757120907c) and its fork, @KhaosT for [this gist](https://gist.github.com/KhaosT/e365acfd589ce840a403), @mplewis for [this gist](https://gist.github.com/mplewis/def678dc4b6e63a86905) and @0ff for [this (almost) working Eve Weather imitating homebridge-plugin](https://gist.github.com/0ff/668f4b7753c80ad7b60b)

## what else

Like this? Please buy me a beer :beers: ...

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.me/skroll)

