var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
mysql = require('mysql');
var nconf = require('nconf');
//var socketIoApp = require('http').createServer()
//io = require('socket.io')(socketIoApp);
var app = express();
var http = require('http').Server(app);
io = require('socket.io')(http);

http.listen(3000, function(){
    console.log('Socket.IO listening on port 3000');
});

var routes = require('./routes/index');
var servers = require('./routes/servers');
var keys = require('./routes/keys');
var wizard = require('./routes/wizard');
var config = require('./routes/config');
var roles = require('./routes/roles')


var middleWareMenu = require('./middleware/menu');

nconf.file({ file: 'config.json'});

dbConf = (nconf.get('database'));
database = mysql.createConnection({
  host : 'localhost',
  user : dbConf.user,
  password : dbConf.password,
  database : dbConf.database
});

database.connect();

io.on('connection', function(socket){
  console.log('a user connected');
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Middleware
app.use(middleWareMenu.handler);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/servers', servers);
app.use('/keys', keys);
app.use('/wizard',wizard);
app.use('/config', config);
app.use('/roles', roles);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
