const mini      = require('minimist')
const fs        = require('fs')
const https     = require('https')
const hypercore = require('hypercore')
const hyperdb   = require('hyperdb')
const hyperkeys = require('dat-encoding')
const ram       = require('random-access-memory')
const wrtc      = require('wrtc')
const swarms    = require('@geut/discovery-swarm-webrtc')
const websocket = require('websocket-stream')
const signalhub = require('signalhub')

function isDb(archive) {
  return !!(archive.get && archive.put && archive.replicate && archive.authorize)
}

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

function webrtc(archive) {
  let channel = hyperkeys.encode(archive.key)
  let hub = signalhub(channel, ['https://rhodey.org:9001'])
  let swarm = swarms({
    stream : () => archive.replicate({ live : true })
  })

  swarm.join(hub, { wrtc, maxPeers : 4 })
  swarm.on('connection', (conn, info) => {
    console.log('wrtc.peer', info)
  })
}

function about(archive) {
  return new Promise((res, rej) => {
    if (isDb(archive)) {
      archive.get('/rw-about', (err) => {
        if (err) { rej(err) }
        else { res(archive) }
      })
    } else {
      archive.get(0, (err) => {
        if (err) { rej(err) }
        else { res(archive) }
      })
    }
  }
}

function websock(archives) {
  let opts = { // todo: read from cmd args
    key: fs.readFileSync('/home/rhodey/certbot/live/rhodey.org/privkey.pem'),
    cert: fs.readFileSync('/home/rhodey/certbot/live/rhodey.org/fullchain.pem')
  }

  let server = https.createServer(opts, (req, res) => res.end('websocket server\n'))

  websocket.createServer({ server }, (peer, req) => {
    let path = url.parse(request.url).path.substr(1)
    let archive = archives[path]
    console.log('wss.server', path, req)

    if (archive === undefined) {
      return peer.end('archive not available')
    }

    let repl = archive.replicate({ live : true })
    repl.pipe(peer).pipe(repl)
    repl.on('error', (err) => console.error('repl.err', err))
    peer.on('error', (err) => console.error('peer.err', err))
  })

  server.listen(8443)
}

function stream(archive) {
  if (isDb(archive)) { return /* todo: sparse db */ }
  let tail = (archive.remoteLength - 1) % 2 == 0 ? archive.remoteLength - 1 : archive.remoteLength - 2
  let opts = { start : tail, live : true }
  let read = archive.createReadStream(opts)
  read.once('error', onclose)
  read.on('data', (buf) => {
    console.log('archive.stream', buf.length)
  })
}

let argv = mini(process.argv.slice(2))
let cmderr = 'expecting command: wss --core dat://hypercore.key --db dat://hyperdb.key'
if (argv._[0] != 'wss' || (!argv.cores && !argv.db)) {
  onclose(cmderr)
}

let cores = (Array.isArray(argv.core) || argv.core.length >= 0) ? [].concat(argv.core) : []
let dbs = (Array.isArray(argv.db) || argv.db.length >= 0) ? [].concat(argv.db) : []

cores = cores.map((uri) => uri.split('dat://')[1]).map((key) => {
  return new Promise((res, rej) => {
    let core = hypercore((fname) => ram(), key, { sparse : true })
    core.once('error', rej)
    core.once('ready', () => { webrtc(core); res(core) })
  })
})

dbs = dbs.map((uri) => uri.split('dat://')[1]).map((key) => {
  return new Promise((res, rej) => {
    let db = hyperdb((fname) => ram(), key)
    db.once('error', rej)
    db.once('ready', () => { webrtc(db); res(db) })
  })
})

Promise.all(cores.concat(dbs))
  .then((archives) => Promise.all(archives.map(about)))
  .then((archives) => {
    let lookup = {}
    archives.forEach((archive) => {
      let id = hyperkeys.encode(archive.key)
      lookup[id] = archive
    })
    websock(lookup)
    archives.forEach(stream)
  }).catch(onclose)
