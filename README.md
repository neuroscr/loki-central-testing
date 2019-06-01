# loki-central-testing
Server for helping testing remote node for network set up 

# usage

## start the server

`node index.js`

## start a client

`node client.js`

You should see something like

```
loki-central-testing user2$ node client.js 
got ip ::ffff:127.0.0.1 from 127.0.0.1
my public ip is maybe ::ffff:127.0.0.1
starting test
test has been running for 5
test has been running for 10
test has been running for 15
test has been running for 20
test has been running for 25
test has been running for 30
test has been running for 35
test has been running for 40
test has been running for 45
test has been running for 50
test has been running for 55
got stop 421844154 from 127.0.0.1
stopping request after 59 s and 4913 ticks, attempted to send 29.99 GB which is 511.76 MB/s
bytes per second: 402.3 MB from ::ffff:127.0.0.1
```
