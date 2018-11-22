module.exports = store

function store (state, emitter) {
  state.readme = 'loading...'

  emitter.on('DOMContentLoaded', function () {
    fetch(new Request('assets/README.md', { cache : 'reload' }))
      .then((r) => r.text())
      .then((readme) => emitter.emit('doc:readme', readme))

    emitter.on('doc:readme', function (readme) {
      state.readme = readme
      emitter.emit(state.events.RENDER)
    })
  })
}
