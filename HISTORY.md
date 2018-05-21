## version history

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