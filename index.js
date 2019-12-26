const netWrap = require('./lets_tcp')
const dgram = require('dgram')
const udpClient = dgram.createSocket('udp4')

// FIXME: limit per incoming IP
// FIXME: cool down period between test

netWrap.disconnect = function() {
  // don't need to log anything atm
}

var portLock = null
var clients = {}
netWrap.serveTCP(3000, function(client) {
  client.last = Date.now()
  //console.log('connection from', client.socket.remoteAddress)
  client.send('ip ' + client.socket.remoteAddress)
  clients[client.socket.remoteAddress.replace(/^::ffff:/, '')] = client
  client.disconnect=function() {
    //console.log('disconnect')
    delete clients[client.socket.remoteAddress]
  }
  client.recv=function(str) {
    if (!client) {
      console.log('received on a null client', str)
      return
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
          console.warn('bad port', parts[1])
          return
        }

        function tryPort(client, port) {
          if (portLock !== null) {
            console.warn('having to wait to test', client.socket.address().address, port)
            setTimeout(1000, function() {
              tryPort(client, port)
            })
            return
          }
          // update errorHandler
          netWrap.errorHandler = function(err) {
            if (err.code != 'ECONNREFUSED') console.error('tcpClient error', err)
            console.warn('port', client.socket.remoteAddress, ':', port, 'is closed')
            client.send('report fail ' + err.code)
            netWrap.errorHandler = null // release our hold
            portLock = null
          }
          // I don't think we need to lock this
          //portLock = true
          if (client.debug) console.log(client.name, 'trying to connect to', client.socket.remoteAddress, port)
          netWrap.connectTCP(client.socket.remoteAddress, port, function(probeClient) {
            // what were you looking for?
            //console.log('connect attempt', client)
            if (client.debug) console.log(client.socket.remoteAddress, ': port', port, 'is open')
            client.send('report good')
            portLock = null
            if (client.debug) console.debug('going to disconnect our probe')
            // don't reconnect
            probeClient.reconnect = false
            // don't disconnect the requestor
            //client.disconncet()
            probeClient.destroy() // cause a disconnect
            probeClient.socket.destroy()
          })
        }
        tryPort(client, port)
      break
      case 'udpsendport':
        // try to connect to this port
        // sanitize user input
        var port = parseInt(parts[1])
        if (!port) {
          client.send('error bad port ' + parts[1])
          console.warn('bad port', parts[1])
          return
        }
        function tryUDPPort(client, port) {
          if (portLock !== null) {
            console.warn('having to wait to test', client.socket.address().address, port)
            setTimeout(1000, function() {
              tryUDPPort(client, port)
            })
            return
          }
          var ipv4host = client.socket.remoteAddress.replace(/^::ffff:/, '')
          if (client.debug)  console.log('trying to connect to', client.socket.remoteAddress, ipv4host, port)
          const message = Buffer.from('Some bytes')
          // FIXME: retry every 1s for 5s
          udpClient.send(message, port, ipv4host, (err) => {
            //console.log('sent', err)
            if (err !== null) console.error('udpClient err', err)
            if (err === null) {
              // udp does the communication with the client
              //client.send('udp sent')
              if (client.debug) console.log(ipv4host, port, 'UDP is open')
            }
          })
        }
        tryUDPPort(client, port)
      break
      case 'udprecvport':

      break
      case 'dc':
        client.reconnect = false
      break
      default:
        console.warn('unknown request', w0, 'from', str)
      break
    }
  }
})

netWrap.serveUDP(1090, function(message, rinfo) {
  var str = message.toString()
  if (str === 'Some bytes') {
    if (clients[rinfo.address]) {
      //console.log('found tcp connection for', rinfo.address)
      clients[rinfo.address].send('report good '+rinfo.port)
    } else {
      console.warn('no client connection for', rinfo.address, 'str', str)
    }
  } else {
    console.warn('received', str, 'from', rinfo.address)
  }
})
