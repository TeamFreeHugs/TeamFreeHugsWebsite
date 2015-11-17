var express = require('express');
var expressSession = require('express-session');
var AM = require('../modules/account-manager.js');
var router = express.Router();

/* GET /users/signup */
router.get('/signup', function (req, res, next) {
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/signup', {title: 'Sign up with Team Free Hugs'});
});

/* GET / */
router.get('/', function (req, res) {
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/index', {title: 'Team Free Hugs Users'});
});

router.post('/signup', function (req, res, next) {
    if (typeof req.body.username === 'undefined') {
        res.status(400);
        res.send(JSON.stringify({
            error: 'No username'
        }));
        return;
    }
    if (typeof req.body.name === 'undefined') {
        req.body.name = req.body.username;
    }
    if (typeof req.body.password === 'undefined') {
        res.status(400);
        res.send(JSON.stringify({
            error: 'No password'
        }));
        return;
    }
    if (typeof req.body.email === 'undefined') {
        res.status(400);
        res.send(JSON.stringify({
            error: 'No email'
        }));
        return;
    }
    {
        AM.addNewAccount({
            name: req.body.name,
            pass: req.body.pass,
            email: req.body.email,
            user: req.body.username
        }, function (e) {
            if (e === 'username-taken') {
                res.status(400);
                res.send(JSON.stringify({
                    error: 'Username already taken'
                }));
            } else if (e === 'email-taken') {
                res.status(400);
                res.send(JSON.stringify({
                    error: 'Email already taken'
                }));
            } else {
                res.status(200);
                res.redirect('/users/login?signup=true');
            }
        })
    }
});

router.get('/login', function (req, res) {
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/login', {title: 'Login to with Team Free Hugs'});
});


module.exports = router;
