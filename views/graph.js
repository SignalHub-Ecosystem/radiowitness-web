const html = require('choo/html')
const Comp = require('choo/component')
const D3Force = require('./d3-force.js')
const TimeDateSelect = require('./time-date.js')

module.exports = view

function view (state, emit) {
  const TITLE = 'd3 thing'
  if (state.title !== TITLE) {
    emit(state.events.DOMTITLECHANGE, TITLE)
  }

  const next = () => emit('graph:next')

  return html`<body>
    <h2>d3</h2>
    <p>database -> ${state.db.msg}</p>
    <p>studio -> ${state.studio.msg}</p>
    <button onclick=${next}>NEXT!</button>
    ${state.cache(TimeDateSelect, 'time').render(state.time)}
    ${state.cache(D3Force, 'd3force').render(state.data, state.active)}
  </body>`
}
