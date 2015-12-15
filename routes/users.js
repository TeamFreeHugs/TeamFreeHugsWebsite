var express = require('express');
var expressSession = require('express-session');
var AM = require('../modules/account-manager.js');
var router = express.Router();


router.get('/', function (req, res) {
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/index', {
        title: 'Team Free Hugs Users',
        user: req.session.user
    });
});

router.get('/current', function (req, res) {
    if (!req.session.user) {
        res.redirect('/users/login?continue=/current');
    } else {
        res.redirect('/users/user/' + req.session.user.name + '/');
    }
});

router.get(/\/current\/\w+\/?$/, function (req, res) {
    console.log('/users/user/' + req.session.user.name + '/' + req.url.split(/\/current\/(\w+)$/)[1]);
    if (!req.session.user) {
        res.redirect('/users/login?continue=' + req.url);
    } else {
        res.redirect('/users/user/' + req.session.user.name + '/' + req.url.split(/\/current\/(\w+)$/)[1]);
    }
});

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

router.get(/\/confirm\/\w+$/, function (req, res) {
    var confirmToken = require('url').parse(req.url).pathname.split(/\/confirm\/(\w+)$/).join('');
    console.log(confirmToken);
    AM.isValidConfirmLink(confirmToken, function (code) {
        if (code === 'valid-token') {
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/confirm', {
                title: 'Confirm your Team Free Hugs Account'
            });
            dbcs.users.findOne({confirmToken: confirmToken}, function (err, user) {
                user.confirmed = true;
                dbcs.users.save(user, {safe: true}, function (err) {
                });
            });
        }
        else if (code === 'token-expired')
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/confirm', {
                title: 'Error while confirming account',
                error: 1
            });
        else if (code === 'no-such-token')
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/errors/error404');
        else if (code === 'token-used')
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/confirm', {
                title: 'Error while confirming account',
                error: 2
            });
    });
});

function regexEscape(input) {
    var escapes = ['.', '*', '+', '^', '$', '[', '(', '\\', '/', '-', '{'];
    var escaped = '(\\' + escapes.join('|\\') + ')+';
    return input.replace(new RegExp(escaped, 'g'), '\\$1');
}

router.post('/find', function (req, res) {
    var type = req.body.type,
        query = req.body.query || '';
    if (!type) {
        res.status(400);
        res.header('Content-Type', 'text/json');
        res.end(JSON.stringify({
            error: 'No type!'
        }));
        return;
    }
    var nameQuery = null;
    switch (parseInt(type)) {
        case 1:
            //Starts with
            nameQuery = new RegExp('^' + regexEscape(query) + '.*', 'i');
            break;
        case 2:
            //Ends with
            nameQuery = new RegExp('.*' + regexEscape(query) + '$', 'i');
            break;
        case 3:
            //Equals
            nameQuery = query;
            break;
        default:
            res.status(400);
            res.send(JSON.stringify({
                error: 'Unknown query type!'
            }));
            res.end();
            return;
    }
    dbcs.users.find({name: nameQuery}, function (err, users) {
        var result = [];
        users.each(function (err, user) {
            if (!!user) {
                result.push({
                    name: user.name,
                    imgURL: user.imgURL
                });
            } else {
                res.status(200);
                res.header('Content-Type', 'text/json');
                res.send(JSON.stringify(result));
                res.end();
            }
        });
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
