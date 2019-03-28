const css  = require('sheetify')
const choo = require('choo')

css('tachyons')

const app = choo()

app.use(require('choo-devtools')())
if (process.env.NODE_ENV === 'production') {
  app.use(require('choo-service-worker')())
}

app.use(require('./lib/stores/root'))

app.route('/', require('./lib/views/main'))
app.route('/*', require('./lib/views/404'))

module.exports = app.mount('body')
