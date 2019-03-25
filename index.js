const css  = require('sheetify')
const choo = require('choo')

css('tachyons')

const app = choo()

app.use(require('choo-devtools')())
if (process.env.NODE_ENV === 'production') {
  app.use(require('choo-service-worker')())
}

app.use(require('./stores/root'))

app.route('/', require('./views/main'))
app.route('/doc', require('./views/doc'))
app.route('/*', require('./views/404'))

module.exports = app.mount('body')
