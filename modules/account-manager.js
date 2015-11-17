var crypto = require('crypto');
var mongo = require('mongodb').MongoClient;
var moment = require('moment');

var dbPort = 27017;
var dbHost = 'localhost';
var dbName = 'TFHWebSite';

/* establish the database connection */

var db,
    users;

mongo.connect('mongodb://localhost:27017/TFHWebSite', {}, function (err, db1) {
    db = db1;

    users = db1.collection('users');
});


/* login validation methods */

exports.autoLogin = function (user, pass, callback) {
    users.findOne({user: user}, function (e, o) {
        if (o) {
            o.pass == pass ? callback(o) : callback(null);
        } else {
            callback(null);
        }
    });
};

exports.manualLogin = function (user, pass, callback) {
    users.findOne({user: user}, function (e, o) {
        if (o == null) {
            callback('user-not-found');
        } else {
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
                    saltAndHash(newData.pass, function (hash) {
                        newData.pass = hash;
                        // append date stamp when record was created //
                        newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
                        users.insert(newData, {safe: true}, callback);
                    });
                }
            });
        }
    });
};

exports.updateAccount = function (newData, callback) {
    users.findOne({user: newData.user}, function (e, o) {
        o.name = newData.name;
        o.email = newData.email;
        o.country = newData.country;
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
}

/* auxiliary methods */

var getObjectId = function (id) {
    return new require('mongodb').ObjectID(id);
}

var findById = function (id, callback) {
    users.findOne({_id: getObjectId(id)},
        function (e, res) {
            if (e) callback(e)
            else callback(null, res)
        });
};


var findByMultipleFields = function (a, callback) {
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
    users.find({$or: a}).toArray(
        function (e, results) {
            if (e) callback(e)
            else callback(null, results)
        });
}