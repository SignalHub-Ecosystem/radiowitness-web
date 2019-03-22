const codec     = require('codecs')('json')
const hyperkeys = require('dat-encoding')
const hypercore = require('hypercore')
const hyperdb   = require('hyperdb')
const ram       = require('random-access-memory')
const swarms    = require('@geut/discovery-swarm-webrtc')
const signalhub = require('signalhub')
const dat       = require('../dat.json')

module.exports = store

function replicate(archive) {
  let channel = hyperkeys.encode(archive.key)
  let hub = signalhub(channel, ['https://rhodey.org:9001'])
  let swarm = swarms({
    stream : () => archive.replicate({ live : true })
  })

  swarm.join(hub, { maxPeers : 4 })
  swarm.on('connection', (conn, info) => {
    console.log('!!! (conn, info) -> ', info)
  })
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

    let hour = Math.floor(Date.now() / 1000.0 / 60 / 60)
    let read = db.createReadStream(`/calls/${hour}/`, { gt : true })
    /* read.on('data', (data) => {
      let key = data[0].key
      console.log('call -> ', key)
      // todo: pass into work stream
    })*/
  })


  emitter.on('studio:ready', (studio) => {
    state.studio = studio
    replicate(studio)
    studio.get(5492, (err, buf) => {
      if (err) { return emitter.emit('error', err) }

      let idx = 0
      let floats = new Float32Array(buf.length / 2)

      while (idx < (buf.length - 1)) {
        floats[idx / 2] = (1.0 * buf.readInt16LE(idx)) / 0x7FFF
        idx += 2
      }

      let ctx = new (window.AudioContext || window.webkitAudioContext)()
      let buff = ctx.createBuffer(1, floats.length, 8000)
      let src = ctx.createBufferSource()

      buff.getChannelData(0).set(floats)
      src.buffer = buff
      src.connect(ctx.destination)
      src.start(0)

      console.log('!!! src.start() !!!')
    })
  })

  emitter.on('DOMContentLoaded', () => {
    fetch(new Request('assets/README.md', { cache : 'reload' }))
      .then((r) => r.text())
      .then((readme) => emitter.emit('doc:readme', readme))

    let dkey = 'd54ab07c5daa1c51f4e39f5e35b67306821b8df9c8bdbc9b561b42b8d13eba49'
    let db = hyperdb((fname) => ram(), dkey)

    db.once('error', (err) => emitter.emit('error', err))
    db.once('ready', () => emitter.emit('db:ready', db))

    let skey = 'e15b79ace0aa20d0ca8f795361621cda789d3d3e825eb5ff09aafb296683d968'
    let studio = hypercore((fname) => ram(), skey, { sparse : true })

    studio.once('error', (err) => emitter.emit('error', err))
    studio.once('ready', () => emitter.emit('studio:ready', studio))
  })
}
