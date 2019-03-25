const codec     = require('codecs')('json')
const hyperkeys = require('dat-encoding')
const hypercore = require('hypercore')
const hyperdb   = require('hyperdb')
const ram       = require('random-access-memory')
const swarms    = require('@geut/discovery-swarm-webrtc')
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

function replicate(archive, cb) {
  let channel = hyperkeys.encode(archive.key)
  let hub = signalhub(channel, ['https://rhodey.org:9001'])
  let swarm = swarms({
    stream : () => archive.replicate({ live : true })
  })

  swarm.join(hub, { maxPeers : 4 })
  swarm.on('connection', (conn, info) => {
    console.log('!!! (conn, info) -> ', info)
    if (cb) { cb(conn, info) }
  })
  document.body.innerText = "!!! repl() !!!"
}

function store (state, emitter) {
  state.readme = 'loading...'

  emitter.on('error', (err) => {
    console.error('!!! error -> ', err)
  })

  emitter.on('doc:readme', (readme) => {
    state.readme = readme
    emitter.emit(state.events.RENDER)
  })

  emitter.on('db:ready', (db) => {
    state.db = db
    replicate(db)

    /*
    let hour = Math.floor(Date.now() / 1000.0 / 60 / 60)
    let read = db.createReadStream(`/calls/${hour}/`, { gt : true })
    read.on('data', (data) => {
      let key = data[0].key
      console.log('call -> ', key)
    })
    */
  })

  emitter.on('studio:peer', (studio) => {
    document.body.innerText = "!!! PEER !!!"
    if (state.studio) { return }
    state.studio = studio

    let tail = (studio.remoteLength - 1) % 2 == 0 ? studio.remoteLength - 1 : studio.remoteLength - 2
    let opts = { start : tail, live : true }
    let read = studio.createReadStream(opts)
    let AudioContext = window.AudioContext || window.webkitAudioContext;
    let ctx = new AudioContext()

    read.on('data', (buf) => {
      if (tail % 2 == 0) {
        document.body.innerText = tail

        let floats = asFloats(buf)
        let buff = ctx.createBuffer(1, floats.length, 8000)
        let src = ctx.createBufferSource()

        buff.getChannelData(0).set(floats)
        src.buffer = buff
        src.connect(ctx.destination)
        src.start(0)

        console.log('!!! src.start() !!!')
      }
      tail++
    })
  })

  emitter.on('studio:ready', (studio) => {
    document.body.innerText = "!!! STUDIO !!!"
    replicate(studio, (conn, info) => {
      setTimeout(() => emitter.emit('studio:peer', studio), 2250)
    })
  })

  emitter.on('DOMContentLoaded', () => {
    document.body.innerText = "!!! LOAD !!!"

    fetch(new Request('assets/README.md', { cache : 'reload' }))
      .then((r) => r.text())
      .then((readme) => emitter.emit('doc:readme', readme))

    let skey = dat.links.publisher[1].href.split('dat://')[1]
    // let skey = 'e15b79ace0aa20d0ca8f795361621cda789d3d3e825eb5ff09aafb296683d968'
    let studio = hypercore((fname) => ram(), skey, { sparse : true })

    studio.once('error', (err) => emitter.emit('error', err))
    studio.once('ready', () => emitter.emit('studio:ready', studio))

    let dkey = dat.links.publisher[2].href.split('dat://')[1]
    // let dkey = 'd54ab07c5daa1c51f4e39f5e35b67306821b8df9c8bdbc9b561b42b8d13eba49'
    let db = hyperdb((fname) => ram(), dkey)

    db.once('error', (err) => emitter.emit('error', err))
    db.once('ready', () => emitter.emit('db:ready', db))
  })
}

module.exports = store
