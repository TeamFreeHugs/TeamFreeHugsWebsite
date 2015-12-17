var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var mongo = require('mongodb').MongoClient;

var MongoStore = require('connect-mongo')(session);

var app = express();

global.dbcs = {};

var routes = require('./routes/index');
var instagram = require('./routes/instagram');
var chat = require('./routes/chat');
var users = require('./routes/users');
var dev = require('./routes/dev');

function noop() {
}

mongo.connect('mongodb://localhost:27017/TFHWebSite', {}, function (err, db) {
    dbcs.db = db;
    if (err) throw err;
    db.createCollection('instagramUserID', function (err, collection) {
        if (err) throw err;
        dbcs.instagramUserID = collection;
    });
    db.createCollection('instagramMediaID', function (err, collection) {
        if (err) throw err;
        dbcs.instagramMediaID = collection;
    });
    db.createCollection('instagramPostDetails', function (err, collection) {
        if (err) throw err;
        dbcs.instagramPostDetails = collection;
    });
    db.createCollection('users', function (err, collection) {
        if (err) throw err;
        dbcs.users = collection;
        collection.findOne({name: 'UniBot'}, function (err, unibot) {
            if (!!unibot) {
                if (!unibot.realPass)
                collection.findOneAndDelete({name: 'UniBot'});
                unibot = null;
            }
            if (!unibot) {
                var keys = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ!@#$%^&8()[]{}\\|;:\'",./<>?-_=+';
                var salt = '';
                for (var i = 0; i < 100; i++) {
                    var p = Math.floor(Math.random() * keys.length);
                    salt += keys[p];
                }
                require('./modules/account-manager').addNewAccount({
                    user: 'UniBot',
                    name: 'UniBot',
                    email: 'edwardyeung39@gmail.com',
                    //Lol school email :D
                    pass: salt
                }, function () {
                    collection.findOne({name: 'UniBot'}, function (err, unibot) {
                        unibot.confirmed = true;
                        unibot.realPass = salt;
                        collection.save(unibot, {safe: true});
                    });
                });
            }
        });
    });
    db.createCollection('chatRooms', function (err, collection) {
        if (err) throw err;
        dbcs.chatRooms = collection;
    });
    db.createCollection('chatUsers', function (err, collection) {
        if (err) throw err;
        dbcs.chatUsers = collection;

    });
    db.createCollection('chatMessages', function (err, collection) {
        if (err) throw err;
        dbcs.chatMessages = collection;
    });
    db.createCollection('chatStars', function (err, collection) {
        if (err) throw err;
        dbcs.chatStars = collection;
    });
    db.createCollection('dev', function (err, collection) {
        if (err) throw err;
        dbcs.dev = collection;
    });
});

app.use(function (req, res, next) {
    res.userAgent = req.headers['user-agent'].toString().toLowerCase();
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


app.use(session({
        secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
        proxy: true,
        resave: true,
        saveUninitialized: true,
        store: new MongoStore({host: 'localhost', port: 27017, db: 'TFHWebSite'})
    })
);
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
app.use('/users', users);
app.use('/dev', dev);


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
            error: err,
            user: req.session.user
        });
        console.log(err);
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    var status = err.status || 500;
    res.status(status);
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/errors/error' + status, {
        message: err.message,
        error: {},
        user: req.session.user
    });
});


module.exports = app;
