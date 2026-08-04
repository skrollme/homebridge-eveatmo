'use strict';

function stubAxios(fakeAxios) {
  const modulePath = require.resolve('axios');
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports: fakeAxios,
  };
}

module.exports = { stubAxios };
