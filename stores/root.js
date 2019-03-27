const codec     = require('codecs')('json')
const hyperkeys = require('dat-encoding')
const hypercore = require('hypercore')
const hyperdb   = require('hyperdb')
const ram       = require('random-access-memory')
const swarms    = require('@geut/discovery-swarm-webrtc')
const websocket = require('websocket-stream')
const signalhub = require('signalhub')
const dat       = require('../dat.json')


function asFloats(buf) {
  let idx = 0
  let floats = new Float32Array(buf.length / 2)

  while (idx < (buf.length - 1)) {
    floats[idx / 2] = (1.0 * buf.readInt16LE(idx)) / 0x7FFF
    idx += 2
  }

  return floats
}

function about(core) {
  return new Promise((res, req) => {
    core.get(0, (err, data) => {
      if (err) {
        rej(err)
      } else {
        res(codec.decode(data))
      }
    })
  })
}

function wrtc(archive, cb) {
  return new Promise((res, rej) => {
    let channel = hyperkeys.encode(archive.key)
    let hub = signalhub(channel, ['https://rhodey.org:9001'])
    let swarm = swarms({
      stream : () => archive.replicate({ live : true })
    })

    swarm.join(hub, { maxPeers : 4 })
    swarm.on('connection', (conn, info) => {
      console.log('!!! wrtc.conn', info)
      res(info)
    })
  })
}

function wss(archive) {
  return new Promise((res, rej) => {
    let ws = websocket('wss://rhodey.org:8443')
    ws.on('error', rej)
    ws.once('connect', () => {
      let repl = archive.replicate({ live : true })
      console.log('!!! wss.conn')
      repl.pipe(ws).pipe(repl)
      repl.on('error', rej)
      res(archive)
    })
  })
}

function store (state, emitter) {
  state.readme = 'loading...'
  state.streaming = false
  state.audio = false

  emitter.on('error', (err) => {
    console.error('!!! error -> ', err)
  })

  emitter.on('doc:readme', (readme) => {
    state.readme = readme
    emitter.emit(state.events.RENDER)
  })

  emitter.on('radio:play', () => {
    if (state.audio) { return }
    let AudioContext = window.AudioContext || window.webkitAudioContext
    state.audio = new AudioContext()
  })

  emitter.on('studio:about', (abt) => {
    if (state.streaming) { return }
    state.streaming = true

    let studio = state.studio
    let tail = (studio.remoteLength - 1) % 2 == 0 ? studio.remoteLength - 1 : studio.remoteLength - 2
    let opts = { start : tail, live : true }
    let read = studio.createReadStream(opts)

    console.log('streaming...')
    read.on('data', (buf) => {
      if (state.audio && tail % 2 == 0) {
        let floats = asFloats(buf)
        let buff = state.audio.createBuffer(1, floats.length, 8000)
        let src = state.audio.createBufferSource()

        buff.getChannelData(0).set(floats)
        src.buffer = buff
        src.connect(state.audio.destination)
        src.start(0)

        console.log('!!! src.start() !!!')
      }
      tail++
    })
  })

  emitter.on('studio:open', (studio) => {
    state.studio = studio

    let timer = setTimeout(() => {
      if (!state.streaming) {
        wss(studio)
          .then(about)
          .then((abt) => emitter.emit('studio:about', abt))
          .catch((err) => emitter.emit('error', err))
      }
    }, 5000)

    /*
    wrtc(studio)
      .then((peer) => about(studio))
      .then((abt) => {
        clearTimeout(timer)
        emitter.emit('studio:about', abt)
      }).catch((err) => emitter.emit('error', err))
      */
  })

  emitter.on('DOMContentLoaded', () => {
    fetch(new Request('assets/README.md', { cache : 'reload' }))
      .then((r) => r.text())
      .then((readme) => emitter.emit('doc:readme', readme))

    // let skey = 'e15b79ace0aa20d0ca8f795361621cda789d3d3e825eb5ff09aafb296683d968'
    let skey = dat.links.publisher[1].href.split('dat://')[1]
    let studio = hypercore((fname) => ram(), skey, { sparse : true })

    studio.once('error', (err) => emitter.emit('error', err))
    studio.once('ready', () => emitter.emit('studio:open', studio))

    // let dkey = 'd54ab07c5daa1c51f4e39f5e35b67306821b8df9c8bdbc9b561b42b8d13eba49'
    let dkey = dat.links.publisher[2].href.split('dat://')[1]
    let db = hyperdb((fname) => ram(), dkey)

    db.once('error', (err) => emitter.emit('error', err))
    db.once('ready', () => emitter.emit('db:open', db))
  })

  /*
  emitter.on('db:open', (db) => {
    state.db = db
    replicate(db)

    let hour = Math.floor(Date.now() / 1000.0 / 60 / 60)
    let read = db.createReadStream(`/calls/${hour}/`, { gt : true })
    read.on('data', (data) => {
      let key = data[0].key
      console.log('call -> ', key)
    })
  })
  */
}

module.exports = store
