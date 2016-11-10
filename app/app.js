var express = require('express')
var app = express()
var path = require('path')
var exphbs = require('express-handlebars')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')

// Controllers/routes
var startController = require('./start/index')
var platformOptionsController = require('./platform-options/index')
var restateController = require('./restate-machine/index')
var serverController = require('./servers/index')
var puppetController = require('./puppet-config/index')
var preFlightController = require('./pre-flight/index')

app.engine('.hbs', exphbs({
  defaultLayout: 'layout',
  extname: '.hbs',
  layoutsDir: path.join(__dirname),
  partialsDir: path.join(__dirname),
  helpers: {
    toJSON: function (object) {
      return JSON.stringify(object)
    },
    debug: function(optionalValue) {
      /* eslint-disable no-console */
      console.log("Current Context");
      console.log("====================");
      console.log(this);

      if (optionalValue) {
        console.log("Value");
        console.log("====================");
        console.log(optionalValue);
      }
      /* eslint-enable no-console */
    }
  }
}))
app.set('view engine', '.hbs')
app.set('views', path.join(__dirname))
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())

app.use('/', startController)
app.use('/platform-options', platformOptionsController)
app.use('/restate-machines', restateController)
app.use('/servers', serverController)
app.use('/puppet-config', puppetController)
app.use('/pre-flight', preFlightController)

// Default error handler
app.use(function (err, req, res) {
  var errorMessage
  if (err.message) {
    errorMessage = '<h3>' + err.message + '</h3>'
  }

  errorMessage = errorMessage + err.stack
  res.status(500).send(errorMessage)
})

app.listen(3000, function () {
  /* eslint-disable no-console */
  console.log('Example app listening on port 3000!')
  /* eslint-enable no-console */
})
