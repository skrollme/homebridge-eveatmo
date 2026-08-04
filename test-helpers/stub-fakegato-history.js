'use strict';

class NoopFakeGatoHistoryService {
  addEntry() {}
}

function stubFakegatoHistory() {
  const modulePath = require.resolve('fakegato-history');
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports: () => NoopFakeGatoHistoryService,
  };
}

module.exports = { stubFakegatoHistory };
