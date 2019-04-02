const html = require('choo/html')
const p5   = require('p5')

const TITLE = 'animation thing'
module.exports = view

function s(p) {
  let x = 100
  let y = 100

  p.setup = function() {
    p.createCanvas(700, 410)
  }

  p.draw = function() {
    p.background(0)
    p.fill(255)
    p.rect(x,y,50,50)
  }
}

function view (state, emit) {
  if (state.title !== TITLE) {
    emit(state.events.DOMTITLECHANGE, TITLE)
  }

  let div = html`<div id="p5"></div>`

  setTimeout(() => {
    let myp5 = new p5(s, div)
    console.log('!!! p5', myp5)
  })

  return html`
    <body>
      <h2>anime</h2>
      ${div}
    </body>`
}
