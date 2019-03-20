const html = require('choo/html')
const dat  = require('../dat.json')

const TITLE = 'RadioWitness'
let key = dat.links.publisher[0].href.split('dat://')[1]
module.exports = view

function view (state, emit) {
  if (state.title !== TITLE) {
    emit(state.events.DOMTITLECHANGE, TITLE)
  }

  console.log(dat.links.publisher[0])
  console.log('!!! key', key)

  return html`<body>
    <h2>${dat.title}</h2>
    <p>${dat.description}</p>
    <p>author.key -> ${key}</p>
  </body>`
}
