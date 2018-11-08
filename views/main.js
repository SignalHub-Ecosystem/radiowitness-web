const html = require('choo/html')
const Markdown = require('marli')
const md = Markdown()

const TITLE = 'RadioWitness'
module.exports = view

function view (state, emit) {
  if (state.title !== TITLE) {
    emit(state.events.DOMTITLECHANGE, TITLE)
  }

  let readme = md`${state.readme}`
  return html`<body>${readme}</body>`
}
