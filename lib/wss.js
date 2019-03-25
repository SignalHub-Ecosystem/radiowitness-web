const mini      = require('minimist')
const http      = require('http')
const hypercore = require('hypercore')
const hyperkeys = require('dat-encoding')
const ram       = require('random-access-memory')
const wrtc      = require('wrtc')
const swarms    = require('@geut/discovery-swarm-webrtc')
const websocket = require('websocket-stream')
const signalhub = require('signalhub')

function onclose(err) {
  if (err) {
    console.error(err)
    process.exit(1)
  } else {
    process.exit(0)
  }

  process.stdin.destroy()
  process.stdout.destroy()
}

function webrtc(core) {
  let channel = hyperkeys.encode(core.key)
  let hub = signalhub(channel, ['https://rhodey.org:9001'])
  let swarm = swarms({
    stream : () => core.replicate({ live : true })
  })

  swarm.join(hub, { wrtc, maxPeers : 4 })
  swarm.on('connection', (conn, info) => {
    console.log('!!! (conn, info) -> ', info)
  })
}

function websock(core) {
  let server = http.createServer((req, res) => {
    console.log('http.server', req)
    res.end('websocket server\n')
  })

  websocket.createServer({ server }, (peer, req) => {
    let repl = core.replicate({ live : true })
    repl.pipe(peer).pipe(repl)
    repl.on('error', (err) => console.error('repl.err', err))
    peer.on('error', (err) => console.error('peer.err', err))
    console.log('ws.server', req)
  })

  server.listen(8080)
}

function about(core) {
  return new Promise((res, req) => {
    core.get(0, (err, data) => {
      if (err) { rej(err) }
      else { res(core) }
    })
  })
}

function stream(core) {
  let tail = (core.remoteLength - 1) % 2 == 0 ? core.remoteLength - 1 : core.remoteLength - 2
  let opts = { start : tail, live : true }
  let read = core.createReadStream(opts)
  read.once('error', onclose)
  read.on('data', (buf) => {
    console.log('buf.len', buf.length)
  })
}

let argv = mini(process.argv.slice(2))
let cmderr = 'expecting command: wss <dat://studio.key>'

if (argv._.length <= 1 || argv._[0] != 'wss') {
  onclose(cmderr)
}

let skey = argv._[1].split('dat://')[1]
let core = hypercore((fname) => ram(), skey, { sparse : true })

core.once('error', onclose)
core.once('ready', () => {
  webrtc(core)
  websock(core)
  about(core)
    .then(stream)
    .catch(onclose)
})
