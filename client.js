const networkTest = require('./lib.networkTest')

networkTest.createClient('127.0.0.1', 3000, function(client) {
  client.testPort(3001, function(results) {
    console.log('port test complete', results)
    client.testUpload(function(results) {
      console.log('FINAL (remote) RESULTS: bytes per second:', networkTest.formatBytes(results.uploadBytesPerSec), 'from', results.ip)
      client.disconnect()
    })
  })
})
