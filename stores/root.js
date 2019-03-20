const hypercore = require('hypercore')
const ram       = require('random-access-memory')
const swarms    = require('@geut/discovery-swarm-webrtc')
const signalhub = require('signalhub')
const dat       = require('../dat.json')

module.exports = store

function store (state, emitter) {
  state.readme = 'loading...'

  emitter.on('error', (err) => {
    console.error('!!! error -> ', err)
  })

  emitter.on('doc:readme', (readme) => {
    state.readme = readme
    emitter.emit(state.events.RENDER)
  })

  emitter.on('dat:ready', (core) => {
    console.log('readyyy')
    state.core = core

    let hub = signalhub('rw.peer', ['https://rhodey.org:9001'])
    let swarm = swarms({
      stream : () => {
        console.log('core.replicate()')
        return core.replicate()
      }
    })

    swarm.join(hub, { maxPeers : 4 })
    swarm.on('connection', (conn, info) => {
      console.log('!!! (conn, info) -> ', info)
    })

    let opts = { tail : true, live : true, wait : true, timeout : 0 }
    let read = core.createReadStream(opts)
    read.on('data', (buf) => console.log('data -> ', buf.toString('utf8')))

    emitter.emit(state.events.RENDER)
  })

  emitter.on('DOMContentLoaded', () => {
    /*fetch(new Request('assets/README.md', { cache : 'reload' }))
      .then((r) => r.text())
      .then((readme) => emitter.emit('doc:readme', readme))*/

    let opts = { sparse : true }
    let key = '86c025bccac90612a02f07190881cf23646d0efb29bf030c57e3ecc8e27508d3'
    let core = hypercore((fname) => ram(), key, opts)

    core.once('error', (err) => emitter.emit('error', err))
    core.once('ready', () => emitter.emit('dat:ready', core))
  })
}
