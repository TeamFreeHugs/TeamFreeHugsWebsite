var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var instagram = require('./routes/instagram');
var chat = require('./routes/chat');

var mongo = require('mongodb').MongoClient;

var app = express();

var usedDBCs = [
    'instagramUserID',
    'instagramMediaID'
];

global.dbcs = {};

mongo.connect('mongodb://localhost:27017/TFHWebSite', {}, function (err, db) {
    if (err) throw err;
    db.createCollection('instagramUserID', function (err, collection) {
        if (err) throw err;
        db.createIndex('userNames', {description: 'text'}, {}, function () {
        });
        dbcs.instagramUserID = collection;
    });
});


app.use(function (req, res, next) {
    res.userAgent = req.headers['user-agent'].toString().toLowerCase();
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, '/public/stylesheets')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('compression')());

app.use('/', routes);
app.use('/instagram', instagram);
app.use('/chat', chat);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {

        var status = err.status || 500;
        res.status(status);
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/errors/error' + status, {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    var status = err.status || 500;
    res.status(status);
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/errors/error' + status, {
        message: err.message,
        error: {}
    });
});


module.exports = app;
