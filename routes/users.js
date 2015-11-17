var express = require('express');
var expressSession = require('express-session');
var AM = require('../modules/account-manager.js');
var router = express.Router();

/* GET /users/signup */
router.get('/signup', function (req, res, next) {
    if (typeof req.session.user !== 'undefined')
        res.redirect('/');
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/signup', {title: 'Sign up with Team Free Hugs'});
});

router.post('/signup', function (req, res, next) {
    if (!req.body.username) {
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/signup', {
            title: 'Sign up with Team Free Hugs',
            error: 'No username!'
        });
        return;
    }
    if (!req.body.name) {
        req.body.name = req.body.username;
    }
    if (!req.body.password) {
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/signup', {
            title: 'Sign up with Team Free Hugs',
            error: 'No password!'
        });
        return;
    }
    if (!req.body.email) {
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/signup', {
            title: 'Sign up with Team Free Hugs',
            error: 'No email!'
        });
        return;
    }

    AM.addNewAccount({
        name: req.body.name,
        pass: req.body.password,
        email: req.body.email,
        user: req.body.username
    }, function (e) {
        if (e === 'username-taken') {
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/signup', {
                title: 'Sign up with Team Free Hugs',
                error: 'Username alredy taken!'
            });
        } else if (e === 'email-taken') {
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/signup', {
                title: 'Sign up with Team Free Hugs',
                error: 'Email already taken!'
            });
        } else {
            res.status(200);
            res.redirect('/users/login?signup=true');
        }
    })

});

router.get('/login', function (req, res) {
    if (typeof req.session.user !== 'undefined') {
        res.redirect('/');
    }
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/login', {title: 'Login to with Team Free Hugs'});
});

router.post('/login', function (req, res) {

    if (typeof req.body.username === 'undefined') {
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/login', {
            title: 'Login to Team Free Hugs',
            error: 'No username!'
        });
        return;
    }
    if (typeof req.body.password === 'undefined') {
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/login', {
            title: 'Login to Team Free Hugs',
            error: 'No password!'
        });
        return;
    }

    AM.manualLogin(req.body.username, req.body.password, function (e, o) {
        if (e === 'user-not-found') {
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/login', {
                title: 'Login to with Team Free Hugs',
                error: 'User not found!'
            });
            return;
        }
        if (e === 'invalid-password') {
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/login', {
                title: 'Login to Team Free Hugs',
                error: 'Invalid password!'
            });
            return;
        }
        req.session.user = o;
        console.log(o);
        res.cookie('user', req.body.username);
        res.cookie('pass', req.body.password);
        res.redirect('/?signup=true');
    });

});

module.exports = router;
