## version history

### 1.2.0
- Added Homebridge 2.0 and HAP 1.0 compatibility
- Added github CI

### 1.1.2
- Fixing "Invalid access token"-issue on restart (https://github.com/skrollme/homebridge-eveatmo/issues/81) 

### 1.1.1
- Thanks to a PR (https://github.com/skrollme/homebridge-eveatmo/pull/76) from @Tellicious:
  - Add new flag to enable/disable AirQuality sensor for indoor modules

### 1.1.0
- allows new auth method (via refreshtoken) and old one (via password)
  - added config-schema to configure this via UI   
- refreshtokens are fetched 5min earlier to do not run into auth problems
  - Added retry on failed refreshtoken-fetch

### 1.0.1
- Thanks to a PR (https://github.com/skrollme/homebridge-eveatmo/pull/65) from @smhex:
  - Logging of "fetching weatherdata" is not configurable

### 1.0.0
- Major version release to reflect breaking change in 0.7.0

### 0.7.0
- Switched to a different authentication-mechanism because Netatmo plans to deprecate the old username/password-authentication ([#62](/../../issues/62))

### 0.6.5
- Added max. wind-strength (gust) to wind-accessory ([#59](/../../issues/59))

### 0.6.4
- Updated fakegato-plugin to 0.6.1

### 0.6.3
- Homebridge 1.3 compatibility ([#56](/../../issues/56))

### 0.6.2
- Thanks to a PR (https://github.com/skrollme/homebridge-eveatmo/pull/54) from @RyanHS7VM:
    - Added a "currently raining" characteristic 

### 0.6.0
- Thanks to a PR (https://github.com/skrollme/homebridge-eveatmo/pull/52) from @foliveira:
    - Support for Netatmo HomeCoach

### 0.5.0
- All thanks to a PR (https://github.com/skrollme/homebridge-eveatmo/pull/36) from @lisanet:
    - Added ConfigUI X settings-panel (https://github.com/oznu/homebridge-config-ui-x/wiki/Developers:-Plugin-Settings-GUI)
    - changed co2 / airquality alert levels (https://blog.evehome.com/wp-content/uploads/2015/12/VOC_EveRoom_EN.pdf)
    - improved error-handling on getStationsData

### 0.4.9 / 0.4.10
- First attempt to implement a mechanism for non-reachable devices (https://github.com/skrollme/homebridge-eveatmo/issues/34)

### 0.4.8
- Updated fakegato-plugin to 0.5.6

### 0.4.7
- Accessory update is now always triggered, even if an error occurs
- refresh trigger from accessories just triggers a cache-read, no api-read

### 0.4.6
- removed startup-logspammer

### 0.4.5
- added an extra co2-characteristic for stock-home.app, can be hidden in eve.app

### 0.4.4
- added a config option which prevents the netatmo's devicename to be prepended and instead appends a configurable name to the modules

### 0.4.3
- added configuration-option to override the alert-state threshold for the extra co2-sensors ([#24](/../../issues/24))

### 0.4.2
- hopefully fixed a problem which caused the low-battery warning to persist even after replacing the module's battery ([#21](/../../issues/21))

### 0.4.1
- setting min value for co2 for investigating history gaps
- anti-crash-fix for netatmo's current API problems

### 0.4.0
- added wind-sensor (still testing)

### 0.3.7
- changed polling mechanism to prevent deadlocks on netatmo API errors 

### 0.3.6
- fixed bug were zero-measurement-values were not applied to characteristics ([#15](/../../issues/15))
- switched to default history length and timer-handling

### 0.3.5
- updated "low-battery"-handling and switched to different service-uuid for _Rain1H_ and _Rain24H_

### 0.3.4
- updated libraries

### 0.3.3
- Increased history storage 

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
- Resolved #7 Marked Eve's custom characteristics as hidden + some defaults for refreshtimings / ttl

### 0.2.9
- Resolved #5 Added configswitch (see config sample above) which adds an additional default-homekit _Carbon Dioxide Sensor_ for notifications

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
