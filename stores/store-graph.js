const d3 = require('d3')

function store (state, emitter) {
  state.active = -1
  state.data = {
    nodes : [],
    links : []
  }

  emitter.on('DOMContentLoaded', () => {
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_network.json")
      .then((data) => {
        state.data = data
        emitter.emit(state.events.RENDER)
        setTimeout(() => {
          state.data.links.pop()
          state.data.links.pop()
          emitter.emit(state.events.RENDER)
        }, 2500)
      })
  })

  emitter.on('dat:ready-db', () => {
    let hour = Math.floor(Date.now() / 1000.0 / 60 / 60)
    let read = state.db.createReadStream(`/calls/${hour}/`, { gt : true })
    read.on('data', (data) => {
      let key = data[0].key
      console.log('call -> ', key)
    })
  })
}

module.exports = store
