var express = require('express');
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
    if (!req.session.user) {
        res.redirect('/users/login?continue=' + req.url);
    } else {
        res.redirect('/users/user/' + req.session.user.name + '/' + req.url.split(/\/current\/(\w+)$/)[1]);
    }
});

/* GET /users/signup */
router.get('/signup', function (req, res) {
    if (typeof req.session.user !== 'undefined')
        res.redirect('/');
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/signup', {title: 'Sign up with Team Free Hugs'});
});

router.post('/signup', function (req, res) {
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
        if (e === 'not-confirmed') {
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/login', {
                title: 'Login to Team Free Hugs',
                error: 'You have not confirmed your account yet! Please visit your email to do so!'
            });
            return;
        }
        req.session.user = o;
        if (req.body.referrer) res.redirect(req.body.referrer); else
            res.redirect('/?signup=true');
    });

});

router.post('/logout', function (req, res) {
    req.session.destroy(function () {
        res.status(200);
        res.send(JSON.stringify({
            msg: 'Ok'
        }));
        res.end();
    });
});

router.get(/\/confirm\/\w+$/, function (req, res) {
    var confirmToken = require('url').parse(req.url).pathname.split(/\/confirm\/(\w+)$/).join('');
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
            res.status(404);
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
        var canModify = false;
        if (!!req.session.user) {
            canModify = req.session.user.name === name || req.session.user.isMod
        }
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/userPage', {
            title: 'User ' + name,
            name: name,
            monthJoined: joinDetails[0],
            dateJoined: joinDetails[1],
            yearJoined: joinDetails[2],
            imgURL: user.imgURL,
            canModify: canModify,
            user: req.session.user,
            aboutMe: require('../modules/helper').markdown(user.aboutMe),
            isMod: user.isMod
        });
    });
});


router.get(/^\/user\/\w+\/edit\/?$/, function (req, res) {
    var name = req.url.match(/user\/(\w+)\/?/)[1];
    dbcs.users.findOne({name: name}, function (err, user) {
        if (!user || !req.session.user || (req.session.user.name !== name && !req.session.user.isMod)) {

            res.status(404);
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/errors/error404', {
                message: 'Not Found',
                error: {},
                user: req.session.user
            });
            return;
        }
        name = user.name;
        var back = "/users/user/" + name + "/";
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/editUser', {
            title: 'User ' + name,
            name: name,
            imgURL: user.imgURL,
            user: req.session.user,
            aboutMe: user.aboutMe,
            back: back,
            editorMod: req.session.user.isMod,
            isMod: user.isMod
        });
    });
});


router.post(/\/user\/\w+\/edit\/?$/, function (req, res) {
    var name = req.url.match(/user\/(\w+)\/?/)[1];
    dbcs.users.findOne({name: name}, function (err, user) {
        if (!user || !req.session.user || (req.session.user.name !== name && !req.session.user.isMod)) {

            res.status(404);
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/errors/error404', {
                message: 'Not Found',
                error: {},
                user: req.session.user
            });
            return;
        }
        name = user.name;
        var newData = {
            user: user.name,
            name: user.name,
            email: user.email,
            aboutMe: req.body.aboutMe || ''
        };
        if (req.session.user.isMod && user.name != "UniBot")
            newData.isMod = !!req.body.isMod || false;

        AM.updateAccount(newData, function (e, o) {
            var back = "/users/user/" + name + "/";
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/editUser', {
                title: 'User ' + name,
                name: name,
                imgURL: user.imgURL,
                user: req.session.user,
                aboutMe: req.body.aboutMe,
                message: 'Profile updated successfully!',
                back: back,
                editorMod: req.session.user.isMod,
                isMod: o.isMod
            });
        });
    });
});

router.get('/forgot', function (req, res) {
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/forgot', {
        title: 'Forgot Password',
        user: req.session.user
    });
});


var generateSalt = function () {
    var keys = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
    var salt = '';
    for (var i = 0; i < 10; i++) {
        var p = Math.floor(Math.random() * keys.length);
        salt += keys[p];
    }
    return salt;
};

router.post('/forgot', function (req, res) {
    var email = req.body.email || '';
    dbcs.users.findOne({email: email, name: {$ne: "UniBot"}}, function (err, user) {
        if (!!user) {
            var args = process.argv.slice(2);
            var resetToken = generateSalt();
            user.resetToken = resetToken;
            dbcs.users.save(user, {safe: true}, noop);
            if (args.indexOf('--no-signup-confirm') != -1) {
                res.redirect('/reset-password/' + resetToken);
                return;
            } else {
                var data = require('fs').readFileSync('views/resetPassword.jade').utf8Slice();
                data = data.replace(/\$\{USERNAME}/, user.user).replace(/\$\{LINK}/, "http://localhost:3000/users/reset-password/" + resetToken);
                transporter.sendMail({
                    from: 'Team Free Hugs <teamfreehugs@teamfreehugs.com>',
                    to: email,
                    subject: 'Password reset for user ' + user.name,
                    html: require('jade').compile(data, {})()
                }, function (error, info) {
                });
            }
        }
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/forgotD', {
            title: 'Email sent!',
            user: req.session.user
        });
    });
});

router.get(/^\/reset\-password\/\w+$/, function (req, res) {
    var token = req.url.split(/^\/reset\-password\/(\w+)$/)[1];
    dbcs.users.findOne({resetToken: token}, function (err, user) {
        if (!user) {
            res.status(404);
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/errors/error404', {
                message: 'Not Found',
                error: {},
                user: req.session.user
            });
            return;
        }
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/resetPassword', {
            user: req.session.user
        });
    });
});

router.post(/^\/reset\-password\/\w+$/, function (req, res) {
    var token = req.url.split(/^\/reset\-password\/(\w+)$/)[1];
    dbcs.users.findOne({resetToken: token}, function (err, user) {
        console.log(user);
        if (!user) {
            res.status(404);
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/errors/error404', {
                message: 'Not Found',
                error: {},
                user: req.session.user
            });
            return;
        }

        delete user.resetToken;
        dbcs.users.save(user, {safe: true}, noop);

        AM.updatePassword(user.email, req.body.password, noop);
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/users/resetPasswordD', {
            user: req.session.user
        });
    });
});

module.exports = router;
