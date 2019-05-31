const networkTest = require('./lib.networkTest')

networkTest.testUpload('127.0.0.1', 3000, function(results) {
  console.log('FINAL (remote) RESULTS: bytes per second:', networkTest.formatBytes(results.uploadBytesPerSec), 'from', results.ip)
})
