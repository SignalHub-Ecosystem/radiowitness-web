const d3    = require('d3')
const codec = require('codecs')('json')

function store (state, emitter) {
  state.active = -1
  state.data = {
    nodes : [],
    links : []
  }

  /*
  emitter.on('DOMContentLoaded', () => {
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_network.json")
      .then((data) => {
        state.data = data
        emitter.emit(state.events.RENDER)
        setTimeout(() => {
          state.data.links.pop()
          state.data.links.pop()
          state.data.nodes.push({id: 11, name: "K"})
          state.data.links.push({source: 1, target: 11})
          emitter.emit(state.events.RENDER)
        }, 2500)
      })
  })
  */

  emitter.on('graph:next', () => {
    state.active += 1
    emitter.emit(state.events.RENDER)
  })

  const mapCounts = (counts) => Object.keys(counts).map((key) => {return {id: parseInt(key), count: counts[key]}})

  emitter.on('dat:ready-db', () => {
    let hour = Math.floor(Date.now() / 1000.0 / 60 / 60)
    let read = state.db.createReadStream(`/calls/${hour}/`, { gt : true })
    let groups = {}
    let radios = {}
    let links = []

    read.on('data', (data) => {
      let key = data[0].key
      let call = codec.decode(data[0].value)
      groups[call.group] = groups[call.group] ? groups[call.group] + 1 : 1
      radios[call.source] = radios[call.source] ? radios[call.source] + 1 : 1
      links.push({source: call.source, target: call.group})
    })
    read.on('end', () => {
      let nodes = mapCounts(groups).map((g) => {g.group = true; return g})
      nodes = nodes.concat(mapCounts(radios))
      state.data.nodes = nodes
      state.data.links = links
      emitter.emit(state.events.RENDER)
    })
  })
}

module.exports = store
