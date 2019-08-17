const css  = require('sheetify')
const choo = require('choo')

css('tachyons')

const app = choo()

app.use(require('choo-devtools')())
if (process.env.NODE_ENV === 'production') {
  app.use(require('choo-service-worker')())
}

app.use(require('./stores/store'))
app.use(require('./stores/store-dat'))

app.route('/', require('./views/d3'))
app.route('/studio', require('./views/studio'))
app.route('/*', require('./views/404'))

module.exports = app.mount('body')
