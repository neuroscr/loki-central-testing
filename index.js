const netWrap = require('./lets_tcp')

// FIXME: limit per incoming IP
// FIXME: cool down period between test

var portLock = null
netWrap.serveTCP(3000, function(client) {
  client.last = Date.now()
  client.send('ip ' + client.socket.address().address)
  client.disconnect=function() {
    //console.log('disconnect')
  }
  client.recv=function(str) {
    if (!client) {
      console.log('received on a null client', str);
      return;
    }
    client.last = Date.now()
    var parts = str.split(/ /)
    var w0    = parts[0]
    switch(w0) {
      case 'start':
        client.bytes = 0
        setTimeout(function() {
          client.send('stop ' + (client.bytes / 60))
        }, 60 * 1000)
      break
      case 'data':
        // just count the bytes
        client.bytes += str.length
      break
      case 'port':
        // try to connect to this port
        // sanitize user input
        var port = parseInt(parts[1])
        if (!port) {
          client.send('error bad port ' + parts[1])
          console.log('bad port', parts[1])
          return
        }

        function tryPort(client, port) {
          if (portLock !== null) {
            console.log('having to wait to test', client.socket.address().address, port)
            setTimeout(1000, function() {
              tryPort(client, port)
            })
            return
          }
          // update errorHandler
          netWrap.errorHandler = function(err) {
            if (err.code != 'ECONNREFUSED') console.error('tcpClient error', err)
            client.send('report fail ' + err.code)
            netWrap.errorHandler = null // release our hold
            portLock = null
          }
          netWrap.connectTCP(client.socket.address().address, port, function(client) {
            console.log('connect attempt', client)
            client.send('report good')
            portLock = null
          })
        }
        tryPort(client, port)
      break
    }
  }
})
