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

    let hub = signalhub('app00', ['https://rhodey.org:9001'])
    hub.subscribe('chan00').on('data', (msg) => {
      console.log('message -> ', msg)
    })

    hub.broadcast('chan00', { hello : 'world' })

    emitter.emit(state.events.RENDER)
  })

  emitter.on('DOMContentLoaded', () => {
    /*fetch(new Request('assets/README.md', { cache : 'reload' }))
      .then((r) => r.text())
      .then((readme) => emitter.emit('doc:readme', readme))*/

    let opts = { sparse : true }
    let key = dat.links.publisher[0].href.split('dat://')[1]
    let core = hypercore((fname) => ram(), key, opts)

    core.once('error', (err) => emitter.emit('error', err))
    core.once('ready', () => emitter.emit('dat:ready', core))
  })
}
