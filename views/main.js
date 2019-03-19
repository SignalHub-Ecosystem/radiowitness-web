const html = require('choo/html')
const dat  = require('../dat.json')

const TITLE = 'RadioWitness'
module.exports = view

function view (state, emit) {
  if (state.title !== TITLE) {
    emit(state.events.DOMTITLECHANGE, TITLE)
  }

  return html`<body>
    <h2>${dat.title}</h2>
    <p>${dat.description}</p>
  </body>`
}
