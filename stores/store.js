function store (state, emitter) {
  state.time = Date.now() - (1000 * 60 * 60)
  state.timeui = state.time

  emitter.on('time:ui', (time) => {
    state.timeui = time
    emitter.emit(state.events.RENDER)
  })

  emitter.on('time:select', (time) => {
    state.time = time
    emitter.emit(state.events.RENDER)
  })
  
}

module.exports = store
