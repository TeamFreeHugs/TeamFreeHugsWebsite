var crypto = require('crypto');
var mongo = require('mongodb').MongoClient;
var moment = require('moment');

/* establish the database connection */

var db,
    users,
    chatUsers;

mongo.connect('mongodb://localhost:27017/TFHWebSite', {}, function (err, db1) {
    if (err) throw err;
    db = db1;
    users = db1.collection('users');
    chatUsers = db1.collection('chatUsers');
});


/* login validation methods */

exports.manualLogin = function (user, pass, callback) {
    users.findOne({user: user}, function (e, o) {
        if (o == null) {
            callback('user-not-found');
        } else {
            if (!o.confirmed) callback('not-confirmed'); else
                validatePassword(pass, o.pass, function (err, res) {
                    if (res) {
                        callback(null, o);
                    } else {
                        callback('invalid-password');
                    }
                });
        }
    });
};

/* record insertion, update & deletion methods */

exports.addNewAccount = function (newData, callback) {
    users.findOne({user: newData.user}, function (e, o) {
        if (o) {
            callback('username-taken');
        } else {
            users.findOne({email: newData.email}, function (e, o) {
                if (o) {
                    callback('email-taken');
                } else {
                    var confirmed = process.argv.slice(2).indexOf('--no-signup-confirm') != -1;
                    saltAndHash(newData.pass, function (hash) {
                        newData.pass = hash;
                        // append date stamp when record was created //
                        newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
                        newData.emailHash = require('md5')(newData.email);
                        newData.imgURL = 'http://gravatar.com/avatar/' + newData.emailHash;
                        newData.aboutMe = '';
                        newData.isMod = false;
                        var today = new Date();
                        var nextDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
                        newData.confirmed = confirmed;
                        newData.confirmToken = generateSalt();
                        newData.tokenExpire = nextDay;
                        users.insert(newData, {safe: true}, callback);
                        var currentKey = require('md5')(new Date().toString() + newData.email + newData.date + generateSalt() + generateSalt() + +new Date + Math.random()) + generateSalt();
                        chatUsers.insert({
                            name: newData.user,
                            email: newData.email,
                            emailHash: newData.emailHash,
                            imgURL: newData.imgURL,
                            key: currentKey,
                            rooms: [],
                            confirmed: false
                        }, {safe: true});
                        if (!confirmed) {
                            var data = require('fs').readFileSync('views/confirmEmail.jade').utf8Slice();
                            data = data.replace(/\$\{USERNAME}/, newData.user).replace(/\$\{TOKEN}/, newData.confirmToken);
                            transporter.sendMail({
                                from: 'Team Free Hugs <teamfreehugs@teamfreehugs.com>',
                                to: newData.email,
                                subject: 'Welcome to Team Free Hugs, ' + newData.user,
                                html: require('jade').compile(data, {})()
                            }, function (error, info) {
                            });
                        }
                    });
                }
            });
        }
    });
};

exports.isValidConfirmLink = function (token, callback) {
    users.findOne({confirmToken: token}, function (err, user) {
        if (!user) {
            callback('no-such-token');
        } else if (+user.tokenExpire < +new Date) {
            callback('token-expired');
        } else if (user.confirmed) {
            callback('token-used');
        } else {
            callback('valid-token');
        }
    });
};

exports.updateAccount = function (newData, callback) {
    users.findOne({user: newData.user}, function (e, o) {
        o.name = newData.name;
        o.email = newData.email;
        o.aboutMe = newData.aboutMe;
        o.isMod = newData.isMod;
        newData.emailHash = require('md5')(newData.email);
        if (newData.pass == '') {
            users.save(o, {safe: true}, function (err) {
                if (err) callback(err);
                else callback(null, o);
            });
        } else {
            saltAndHash(newData.pass, function (hash) {
                o.pass = hash;
                users.save(o, {safe: true}, function (err) {
                    if (err) callback(err);
                    else callback(null, o);
                });
            });
        }
    });
};

exports.updatePassword = function (email, newPass, callback) {
    users.findOne({email: email}, function (e, o) {
        if (e) {
            callback(e, null);
        } else {
            saltAndHash(newPass, function (hash) {
                o.pass = hash;
                users.save(o, {safe: true}, callback);
            });
        }
    });
};

/* account lookup methods */

exports.deleteAccount = function (id, callback) {
    users.findOneAndDelete({_id: getObjectId(id)}, callback);
};

exports.getAccountByEmail = function (email, callback) {
    users.findOne({email: email}, function (e, o) {
        callback(o);
    });
};

exports.getAccountByEmailHash = function (hash, callback) {
    users.findOne({emailHash: hash}, function (e, o) {
        callback(o);
    });
};

exports.validateResetLink = function (email, passHash, callback) {
    users.find({$and: [{email: email, pass: passHash}]}, function (e, o) {
        callback(o ? 'ok' : null);
    });
};

exports.getAllRecords = function (callback) {
    users.find().toArray(
        function (e, res) {
            if (e) callback(e);
            else callback(null, res)
        });
};

exports.delAllRecords = function (callback) {
    users.remove({}, callback); // reset users collection for testing //
};

/* private encryption & validation methods */

var generateSalt = function () {
    var keys = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
    var salt = '';
    for (var i = 0; i < 10; i++) {
        var p = Math.floor(Math.random() * keys.length);
        salt += keys[p];
    }
    return salt;
};

var md5 = function (str) {
    return crypto.createHash('md5').update(str).digest('hex');
};

var saltAndHash = function (pass, callback) {
    var salt = generateSalt();
    callback(salt + md5(pass + salt));
};

var validatePassword = function (plainPass, hashedPass, callback) {
    var salt = hashedPass.substr(0, 10);
    var validHash = salt + md5(plainPass + salt);
    callback(null, hashedPass === validHash);
};
/* auxiliary methods */

var getObjectId = function (id) {
    return new require('mongodb').ObjectID(id);
};

var findById = function (id, callback) {
    users.findOne({_id: getObjectId(id)},
        function (e, res) {
            if (e) callback(e);
            else callback(null, res)
        });
};


var findByMultipleFields = function (a, callback) {
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
    users.find({$or: a}).toArray(
        function (e, results) {
            if (e) callback(e);
            else callback(null, results);
        });
};
