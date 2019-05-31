const slice = 10
const blocksPerTick = 100

function testUpload(cb) {
  const netWrap = require('./lets_tcp')
  var timer = null
  var uiTimer = null
  var ticks = 0
  var count = 0

  function stopTest() {
    if (timer) clearInterval(timer)
    if (uiTimer) clearInterval(uiTimer)
  }

  netWrap.recv = function(pkt, client) {
    console.log('got', pkt, 'from', client.socket.address().address)
    var parts = pkt.split(/ /)
    var w0    = parts[0]
    switch(w0) {
      case 'ip':
        console.log('my public ip is maybe', parts[1])
        // start test
        console.log('starting test')
        client.send('start')
        count = 0
        uiTimer = setInterval(function() {
          count++
          if (count % 5 == 0) {
            console.log('test has been running for', count)
          }
          // back up, incase something goes wrong?!?
          if (count > 120) {
            stopTest()
            client.destroy() // cause a disconnect
          }
        }, 1000)
        // send roughly 64k per 1ms (640k per 10ms)
        const block = 'data '+'0123456789'.repeat(100 * 64)
        timer = setInterval(function() {
          for(var i = 0; i < blocksPerTick; i++) {
            client.send(block)
          }

          ticks++
        }, slice)
      break
      case 'stop':
        console.log('stopping request after', count, 's and', ticks, 'ticks, attempted to send', formatBytes(blocksPerTick * ticks * 65535), 'which is', formatBytes(blocksPerTick * ticks * 65535 / 60)+'/s')
        stopTest()
        client.reconnect = false
        //client.disconncet()
        client.destroy() // cause a disconnect
        client.socket.destroy()
        cb(parts[1])
      break
    }
  }

  netWrap.disconnect = function(client) {
    console.log('disconnected, stopping any pending tests')
    stopTest()
  }

  netWrap.connectTCP('127.0.0.1', 3000, function(client) {
    // don't reconnect on disconnect (so we can actually force a disconnect when done)
    client.reconnect = false
  })
}

// from https://stackoverflow.com/a/18650828
function formatBytes(bytes, decimals = 2) {
  if(bytes == 0) return '0 Bytes'
  var k = 1024,
     dm = decimals <= 0 ? 0 : decimals || 2,
     sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
     i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

testUpload(function(bytesPerSec) {
  console.log('bytes per second:', formatBytes(bytesPerSec))
})
