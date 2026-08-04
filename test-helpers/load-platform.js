'use strict';

function loadPlatform(homebridgeStub) {
  let CapturedPlatform = null;
  const stub = Object.assign({}, homebridgeStub, {
    registerPlatform(pluginName, platformName, PlatformClass) {
      CapturedPlatform = PlatformClass;
    },
  });

  /* eslint-disable-next-line @typescript-eslint/no-require-imports */
  require('../index')(stub);

  return CapturedPlatform;
}

module.exports = { loadPlatform };
