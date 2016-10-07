var express = require('express')
var app = express()
var path = require('path')
var exphbs = require('express-handlebars')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')

// Controllers/routes
var startController = require('./start/index')
var platformOptionsController = require('./platform-options/index')

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
      console.log("Current Context");
      console.log("====================");
      console.log(this);

      if (optionalValue) {
        console.log("Value");
        console.log("====================");
        console.log(optionalValue);
      }
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


// Default error handler
app.use(function (err, req, res, next) {
  var errorMessage
  if (err.message) {
    errorMessage = '<h3>' + err.message + '</h3>'
  }

  errorMessage = errorMessage + err.stack
  console.error(err)
  res.status(500).send(errorMessage)
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
