var websocket = require('ws');
var requests = require('request');
var jsdom = require('jsdom');
var o_o = require('yield-yield');

module.exports = function TFHCAPI(username, password, host, callback) {
    var userInfo = {
        host: host
    };
    requests.post({
        url: 'http://' + host + '/users/login',
        headers: {
            'User-Agent': 'NodeJS'
        },
        form: {
            username: username,
            password: password,
            referrer: '/chat/'
        }
    }, function (err, resp, body) {
        if (err) throw err;
        if (!resp.headers['set-cookie'])     throw new Error('Invalid credentials!');
        requests.get({
            url: 'http://' + host + '/chat/',
            headers: {
                'User-Agent': 'NodeJS',
                'Cookie': resp.headers['set-cookie'][0]
            }
        }, function (err, resp, body) {
            jsdom.env(body, [], function (err, window) {
                var key = window.document.querySelector('#key');
                if (!key) {
                    throw new Error('Invalid credentials!');
                }
                userInfo.key = key.value;
                if (callback)
                    callback();
            });
        });
    });
    this.getRoom = function (roomID, callback) {
        requests.get({
            url: 'http://' + host + '/chat/rooms/' + roomID,
            followAllRedirects: true,
            headers: {
                'User-Agent': 'NodeJS'
            }
        }, function (err, resp, body) {
            if (err)
                callback(err, null);
            else
                jsdom.env(body, [], function (err, window) {
                    if (window.document.title === '404 Page Not Found') {
                        callback(new Error('No Such Room'), null);
                    } else {
                        callback(null, new Room(roomID,
                            window.document.querySelector('body > div.wrapper > div.rightBar > h4').textContent,
                            window.document.querySelector('body > div.wrapper > div.rightBar > p > small').textContent, userInfo.key, userInfo.host));
                    }
                });
        });
    };
    return this;
};

function Room(id, name, desc, key, host) {
    this.getRoomID = function () {
        return id;
    };
    this.getRoomName = function () {
        return name;
    };
    this.getRoomDescription = function () {
        return desc;
    };
    this.getHost = function () {
        return host;
    };
    this.join = function () {
        requests.post(
            {
                url: 'http://' + this.getHost() + '/chat/rooms/' + id + '/join',
                headers: {
                    'User-Agent': 'NodeJS'
                },
                form: {
                    key: key
                }
            }, function (err, resp, body) {
            });
    };
    this.leave = function () {
        requests.post(
            {
                url: 'http://' + this.getHost() + '/chat/rooms/' + id + '/leave',
                headers: {
                    'User-Agent': 'NodeJS'
                },
                form: {
                    key: key
                }
            }, function (err, resp, body) {
            });
    };
    this.sendMessage = function (text) {
        requests.post(
            {
                url: 'http://' + this.getHost() + '/chat/rooms/' + id + '/messages/add',
                headers: {
                    'User-Agent': 'NodeJS'
                },
                form: {
                    key: key,
                    text: text
                }
            }, function (err, resp, body) {
            });
    };
    return this;
}