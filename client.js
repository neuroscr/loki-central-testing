const networkTest = require('./lib.networkTest')
networkTest.testUpload(function(results) {
  console.log('bytes per second:', networkTest.formatBytes(results.uploadBytesPerSec), 'from', results.ip)
})
