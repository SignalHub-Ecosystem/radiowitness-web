const mini      = require('minimist')
const hypercore = require('hypercore')
const hyperkeys = require('dat-encoding')
const ram       = require('random-access-memory')
const wrtc      = require('wrtc')
const swarms    = require('@geut/discovery-swarm-webrtc')
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

function createCore() {
  let opts = { sparse : true }
  let core = hypercore((fname) => ram(), opts)
  return new Promise((res, rej) => {
    core.once('ready', () => {
      console.log('create.ready()')
      console.log(`dat://${hyperkeys.encode(core.key)}`)
      res(core)
    })
    core.once('error', rej)
  })
}

function openCore(uri) {
  let key = uri.split('dat://')[1]
  let opts = { sparse : true }
  let core = hypercore((fname) => ram(), key, opts)
  return new Promise((res, rej) => {
    core.once('ready', () => {
      console.log('open.ready()')
      res(core)
    })
    core.once('error', rej)
  })
}

let count = 0
let argv = mini(process.argv.slice(2))
let open = (argv._.length <= 0) ? createCore() : openCore(argv._[0])

open.then((core) => {
  let hub = signalhub('rw.peer', ['https://rhodey.org:9001'])
  let swarm = swarms({
    stream : () => {
      console.log('core.replicate()')
      return core.replicate()
    }
  })

  swarm.join(hub, { wrtc, maxPeers : 4 })
  swarm.on('connection', (conn, info) => {
    console.log('!!! (conn, info) -> ', info)
  })

  if (core.writable) {
    setInterval(() => core.append(`hello ${count++}`), 2250)
  } else {
    let opts = { tail : true, live : true, wait : true, timeout : 0 }
    let read = core.createReadStream(opts)
    read.on('data', (buf) => console.log('data -> ', buf.toString('utf8')))
  }
}).catch(onclose)
