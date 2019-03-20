const codec     = require('codecs')('json')
const hyperkeys = require('dat-encoding')
const hypercore = require('hypercore')
const hyperdb   = require('hyperdb')
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

  emitter.on('dat:ready', (db) => {
    console.log('readyyy')
    state.db = db

    let channel = hyperkeys.encode(db.key)
    let hub = signalhub(channel, ['https://rhodey.org:9001'])
    let swarm = swarms({
      stream : () => {
        console.log('db.replicate()')
        return db.replicate({ live : true })
      }
    })

    swarm.join(hub, { maxPeers : 4 })
    swarm.on('connection', (conn, info) => {
      console.log('!!! (conn, info) -> ', info)
    })

    let hour = Math.floor(Date.now() / 1000.0 / 60 / 60)
    let read = db.createReadStream(`/calls/${hour}/`, { gt : true })
    read.on('data', (data) => {
      let key = data[0].key
      console.log('call -> ', key)
    })

    emitter.emit(state.events.RENDER)
  })

  emitter.on('DOMContentLoaded', () => {
    /*fetch(new Request('assets/README.md', { cache : 'reload' }))
      .then((r) => r.text())
      .then((readme) => emitter.emit('doc:readme', readme))*/

    let key = '59ae6971597e9788bd6c50b1db3f2131ca5536753aeb0cf904ec9a4745574a09'
    let db = hyperdb((fname) => ram(), key)

    db.once('error', (err) => emitter.emit('error', err))
    db.once('ready', () => emitter.emit('dat:ready', db))
  })
}
