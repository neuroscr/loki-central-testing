const networkTest = require('./lib.networkTest')

networkTest.testUpload(function(results) {
  console.log('FINAL (remote) RESULTS: bytes per second:', networkTest.formatBytes(results.uploadBytesPerSec), 'from', results.ip)
})
