'use strict';

function createFakeAxios() {
  return {
    post: () => Promise.reject(new Error('axios.post not stubbed for this call')),
    get: () => Promise.reject(new Error('axios.get not stubbed for this call')),
  };
}

module.exports = { createFakeAxios };
