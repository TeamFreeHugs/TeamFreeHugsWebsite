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

    if (req.body.username.indexOf(' ') != -1) {
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/signup', {
            title: 'Sign up with Team Free Hugs',
            error: 'Username cannot contain spaces!'
        });
    }

    AM.addNewAccount({
        pass: req.body.password,
        email: req.body.email,
        user: req.body.username,
        name: req.body.username
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
            if (req.body.referrer) res.redirect('/users/login?signup=true&continue=' + req.body.referrer); else
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
        if (req.body.referrer) res.redirect(req.body.referrer); else
            res.redirect('/?signup=true');
    });

});

router.post('/logout', function (req, res) {
    req.session.destroy(function (e) {
        res.status(200);
        res.send(JSON.stringify({
            msg: 'Ok'
        }));
        res.end();
    });
});


router.get(/\/user\/\w+\/?$/, function (req, res) {
    var name = req.url.match(/user\/(\w+)\/?/)[1];
    dbcs.users.findOne({name: name}, function (err, user) {
        if (!user) {
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/errors/error404', {
                message: 'Not Found',
                error: {},
                user: req.session.user
            });
            return;
        }
        var name = user.name;
        var joinDetails = user.date.split(/(\w+) (\d+\w+) (\d+), /).filter(function (e) {
            return !!e;
        });
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/userPage', {
            title: 'User ' + name,
            name: name,
            monthJoined: joinDetails[0],
            dateJoined: joinDetails[1],
            yearJoined: joinDetails[2],
            imgURL: user.imgURL,
            isOwn: !req.session.user || req.session.user.name === name,
            user: req.session.user,
            aboutMe: user.aboutMe
        });
    });
});


router.get(/\/user\/\w+\/edit\/?$/, function (req, res) {
    var name = req.url.match(/user\/(\w+)\/?/)[1];
    dbcs.users.findOne({name: name}, function (err, user) {
        if (!user || !req.session.user || req.session.user.name === name) {
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/errors/error404', {
                message: 'Not Found',
                error: {},
                user: req.session.user
            });
            return;
        }
        var name = user.name;
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/editUser', {
            title: 'User ' + name,
            name: name,
            imgURL: user.imgURL,
            user: req.session.user,
            aboutMe: user.aboutMe
        });
    });
});


router.post(/\/user\/\w+\/edit\/?$/, function (req, res) {
    var name = req.url.match(/user\/(\w+)\/?/)[1];
    dbcs.users.findOne({name: name}, function (err, user) {
        if (!user || !req.session.user || req.session.user.name === name) {
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/errors/error404', {
                message: 'Not Found',
                error: {},
                user: req.session.user
            });
            return;
        }
        var name = user.name;
        AM.updateAccount({
            user: user.name,
            name: user.name,
            email: user.email,
            imgURL: user.imgURL,
            aboutMe: req.body.aboutMe || '',
            pass: req.body.password || ''
        }, function () {
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/editUser', {
                title: 'User ' + name,
                name: name,
                imgURL: user.imgURL,
                user: req.session.user,
                aboutMe: req.body.aboutMe,
                message: 'Profile updated successfully!'
            });
        });
    });
});

module.exports = router;
