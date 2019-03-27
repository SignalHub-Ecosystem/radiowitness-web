const html = require('choo/html')
const dat  = require('../dat.json')

const TITLE = 'RadioWitness'
module.exports = view

function view (state, emit) {
  if (state.title !== TITLE) {
    emit(state.events.DOMTITLECHANGE, TITLE)
  }

  const play = () => emit('radio:play')

  return html`<body>
    <h2>${dat.title}</h2>
    <p>${dat.description}</p>
    <p>${dat.title} is participating as a Publisher in the RadioWitness p2p network, <a href="/doc">learn more here.</a></p>
    <button onclick=${play}>PLAY!</button>
    <p>wrtc://${state.wrtc}</p>
    <p>wss://${state.wss}</p>
    <p>tail -> ${state.tail}</p>
  </body>`
}
