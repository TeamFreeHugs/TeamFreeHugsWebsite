var express = require('express');
var WebSocketServer = require('ws').Server;
var url2 = require('url');
var unibot = require('../Chatbot-Unibot');
var http = require('http');
var colors = require('colors');

var wsHttpServer = http.createServer(function (req, res) {
    if (!req.url.match(/\/rooms\/\d+/)) {
        res.writeHead(200);
        console.log(req.method.toUpperCase() + ' :4000' + req.url + ' ' + colors.styles.green.open + '200' + colors.styles.green.close);
        res.end('This is the TFHWebSite Chat Websocket server.');
    } else {
        res.writeHead(400);
        console.log(req.method.toUpperCase() + ' :4000' + req.url + ' ' + colors.styles.yellow.open + '200' + colors.styles.yellow.close);
        res.end('Looks like you are trying to request a chat room. Use a WebSocket instead.');
    }
}).listen(4000);
var wsServer = new WebSocketServer({
    server: wsHttpServer
});

var wsRooms = {};
require('mongodb').MongoClient.connect('mongodb://localhost:27017/TFHWebSite', {}, function (err, db) {
    var chatRooms = db.collection('chatRooms');
    chatRooms.find(function (err, rooms) {
        rooms.each(function (err, e) {
            if (!e)
                return;
            wsRooms[e.roomId] = [];
            unibot(e.roomId);
        });
    });
});

wsServer.on('connection', function (ws) {
    var url = url2.parse(ws.upgradeReq.url, true);
    var location = url.path.toString();
    var userKey = url.query.key;
    if (location.match(/\/rooms\/\d+/)) {
        var roomID = parseInt(location.match(/\d+/)[0]);
        dbcs.chatRooms.findOne({roomId: roomID}, function (err, room) {
            if (!room) {
                ws.send(JSON.stringify({
                    error: 'No such room!'
                }));
                ws.close();
                console.log('GET :4000' + ws.upgradeReq.url + ' ' + colors.styles.yellow.open + '200' + colors.styles.yellow.close);
                return;
            }
            if (!wsRooms[roomID])
                wsRooms[roomID] = [];
            if (userKey) {
                dbcs.chatUsers.findOne({key: userKey}, function (err, user) {
                    if (!user) {
                        ws.send(JSON.stringify({
                            error: 'Invalid key!'
                        }));
                        console.log('GET :4000' + ws.upgradeReq.url + ' ' + colors.styles.yellow.open + '200' + colors.styles.yellow.close);
                        ws.close();
                        return;
                    }
                    ws.username = user.name;
                });
            }
            wsRooms[roomID].push(ws);
            console.log('GET :4000' + ws.upgradeReq.url + ' ' + colors.styles.green.open + '200' + colors.styles.green.close);
        });
    }
});
var dayInMilliseconds = 1000 * 60 * 60 * 24;


var generateSalt = function () {
    var keys = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
    var salt = '';
    for (var i = 0; i < 10; i++) {
        var p = Math.floor(Math.random() * keys.length);
        salt += keys[p];
    }
    return salt;
};

global.dailyChatKeyUpdate = function dailyChatKeyUpdate() {
    dbcs.chatUsers.find(function (err, users) {
        users.each(function (err, user) {
            if (!user) return;
            user.key = require('md5')(new Date().toString() + user.email + +new Date + generateSalt() + generateSalt() + +new Date + Math.random()) + generateSalt();
            user.rooms.forEach(function (r) {
                if (!wsRooms[r]) return;
                wsRooms[r].forEach(function (ws) {
                    if (ws.username === user.name)
                        if (wsRooms[r][ws].readyState === wsRooms[r][ws].OPEN)
                            wsRooms[r][ws].send(JSON.stringify({}));
                });
            });
            dbcs.chatUsers.save(user, {safe: true});
        });
    });
};

var todayInfo = new Date().toString().match(/^\w+ (\w+) (\d+) (\d+)/).slice(1, 4);
var milliUntilEndOfToday = +new Date(todayInfo[0] + ' ' + (parseInt(todayInfo[1]) + 1) + ' ' + todayInfo[2] + ' 00:01:00') - +new Date;
setTimeout(function () {
    setInterval(dailyChatKeyUpdate, 8.64e+7);
}, milliUntilEndOfToday);

var router = express.Router();

/* GET /chat/ */
router.get('/', function (req, res) {
    if (!!req.session.user)
        dbcs.chatUsers.findOne({name: req.session.user.name}, function (err, user) {
            res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/chat/index', {
                title: 'Team Free Hugs Chat',
                user: req.session.user,
                chatUser: user
            });
        });
    else
        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/chat/index', {
            title: 'Team Free Hugs Chat',
            user: req.session.user
        });
});


/* GET /chat/ */
router.get('/', function (req, res) {
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/chat/index', {
        title: 'Team Free Hugs Chat',
        user: req.session.user
    });
});

router.get('/rooms/add', function (req, res) {
    if (!req.session.user) {
        res.redirect('/users/login?continue=/chat/rooms/add');
        return;
    }
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/chat/addRoom', {
        title: 'Team Free Hugs Chat',
        user: req.session.user
    });

});

router.post('/rooms/add', function (req, res) {
    if (!req.session.user) {
        res.redirect('/users/login?continue=/chat/rooms/add');
        return;
    }
    if (!req.body.roomName) {
        res.status(400);
        res.send(JSON.stringify({
            error: 'No name!'
        }));
        res.end();
        return;
    }

    if (req.body.roomName.length > 30) {
        res.status(400);
        res.send(JSON.stringify({
            error: 'Room name too long!'
        }));
        res.end();
    }

    dbcs.chatRooms.find({}, function (e, rooms) {
        rooms.count(function (e, count) {
            dbcs.chatRooms.insert({
                name: req.body.roomName,
                roomId: count,
                description: req.body.roomDescription || ''
            }, function () {
                res.redirect('/chat/rooms/' + count + '/' + getRoomName(req.body.roomName));
                res.end();
                wsRooms[count] = [];
                unibot(count);
            });
        });
    });

});

function getRoomName(realName) {
    return realName.trim().toLowerCase().replace(/ +/g, '-').replace(/[!@#\$%^&*\()\{}\[\]|\\;:'",\./?<>~`_+=]/g, '');
}

router.get('/rooms', function (req, res) {
    //res.status(200);
    var limit = parseInt(url2.parse(req.url, true).query.number || 10);
    dbcs.chatRooms.find(function (error, rooms) {
        rooms.limit(limit).each(function (err, room) {
            if (!room) {
                res.end();
                return;
            }
            var roomID = room.roomId;
            //noinspection HtmlUnknownTarget
            var toSend = "<div class='roomcard' id='roomcard-" + roomID + "'>" +
                "<h3><a style='text-decoration: none;' href='/chat/rooms/" + roomID + "/" + getRoomName(room.name) + "/'>" + room.name + "</a></h3>" +
                "<small style='margin-left: 10px;'>" + room.description + "</small>" +
                "</div>";
            res.write(toSend);
        });
    });

});

router.get(/\/rooms\/\d+(?:\/(?:\w+|\-)+)?/, function (req, res) {
    if (req.url.match(/rooms\/\d+/)) {
        dbcs.chatRooms.findOne({roomId: parseInt(req.url.split(/rooms\/(\d+)/)[1])}, function (e, room) {
            if (!room) {
                //Room doesn'dailyChatKeyUpdate exist
                res.status(404);
                res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/errors/error404', {
                    message: 'Not Found',
                    error: new Error('Not Found'),
                    user: req.session.user,
                    moreInfo: 'Sometimes, rooms may be deleted for moderation purposes. This may happen if the room is spam or rude.'
                });
                return;
            }
            if (!req.url.match(new RegExp('rooms/' + room.roomId + '/' + getRoomName(room.name).replace(/\-/g, '\\-')))) {
                res.redirect('/chat/rooms/' + room.roomId + '/' + getRoomName(room.name));
                res.end();
            } else {
                if (!!req.session.user)
                    dbcs.chatUsers.findOne({name: req.session.user.name}, function (e, user) {
                        res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/chat/chatRoom', {
                            title: 'TFHChat: ' + room.name,
                            user: req.session.user,
                            name: room.name,
                            description: room.description,
                            roomLink: '/chat/rooms/' + room.roomId + '/' + getRoomName(room.name),
                            emailHash: req.session.user.emailHash,
                            key: user.key
                        });
                    });
                else
                    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/chat/chatRoom', {
                        title: 'TFHChat: ' + room.name,
                        name: room.name,
                        description: room.description,
                        roomLink: '/chat/rooms/' + room.roomId + '/' + getRoomName(room.name)
                    });

            }
        });
    }
});

function broadcastWSEvent(roomID, event) {
    for (var ws in wsRooms[roomID]) {
        if (wsRooms[roomID].hasOwnProperty(ws)) {
            if (wsRooms[roomID][ws].readyState === wsRooms[roomID][ws].OPEN)
                wsRooms[roomID][ws].send(event);
        }
    }
}

setInterval(function () {
    for (var room in wsRooms) {
        if (wsRooms.hasOwnProperty(room)) {
            wsRooms[room] = wsRooms[room].filter(function (e) {
                return e.readyState === e.OPEN;
            });
        }
    }
}, 1000);

function canStringPingUser(pingString, userToPing) {
    pingString = pingString.toLowerCase();
    userToPing = userToPing.toLowerCase();
    if (pingString.startsWith('@'))
        pingString = pingString.substr(1);
    if (pingString.length < 3)
        return false;
    return !!userToPing.match(new RegExp(pingString.replace(/\./, '\\.').replace(/\(/, '\\(').replace(/-/, '\\-')))
}

router.post(/\/rooms\/\d+\/messages\/add\/?$/, function (req, res) {
    if (!req.body.key) {
        res.status(400);
        res.send(JSON.stringify({
            error: 'No key'
        }));
        res.end();
        return;
    }
    var roomID = parseInt(req.url.match(/\d+/).join(''));
    dbcs.chatRooms.findOne({roomId: roomID}, function (e, room) {
        if (!room) {
            res.status(400);
            res.send(JSON.stringify({
                error: 'Room not found'
            }));
            return;
        }
        if (!req.body.text) {
            res.status(400);
            res.send(JSON.stringify({
                error: 'No message'
            }));
            return;
        }
        var key = req.body.key;
        dbcs.chatUsers.findOne({key: key}, function (err, user) {
            if (!user) {
                res.status(400);
                res.send(JSON.stringify({
                    error: 'Invalid key'
                }));
                res.end();
                return;
            }
            if (user.rooms.indexOf(roomID) === -1) {
                user.rooms.push(roomID);
                dbcs.chatUsers.save(user, {safe: true}, function () {
                });
                broadcastWSEvent(roomID, JSON.stringify({
                    eventType: 2,
                    user: user.name,
                    userImgURL: user.imgURL
                }));
            }
            dbcs.chatMessages.count(function (e, count) {
                dbcs.chatMessages.insert({
                    roomId: roomID,
                    text: req.body.text,
                    senderImgURL: user.imgURL,
                    senderName: user.name,
                    id: count + 1,
                    starred: false,
                    starCount: 0,
                    starrers: []
                });

                broadcastWSEvent(roomID, JSON.stringify({
                    eventType: 1,
                    content: req.body.text,
                    senderName: user.name,
                    senderImg: user.imgURL,
                    messageID: count
                }));
                var pings = req.body.text.match(/@\w+/g);
                if (pings)
                    pings.forEach(function (ping) {
                        //Find user in room
                        dbcs.chatUsers.find({rooms: {$in: [roomID]}}, function (err, users) {
                            users.each(function (e, foundUser) {
                                if (!foundUser)
                                    return;
                                if (foundUser.name === user.name)
                                    return;
                                if (canStringPingUser(ping, foundUser.name)) {
                                    if (wsRooms[roomID])
                                        wsRooms[roomID].forEach(function (websocket) {
                                            if (websocket.username) {
                                                if (websocket.username === foundUser.name) {
                                                    websocket.send(JSON.stringify({
                                                        eventType: 4,
                                                        messageID: count,
                                                        content: req.body.text
                                                    }));
                                                }
                                            }
                                        });
                                }
                            });
                        });
                    });
            });

            res.status(200);
            res.send('');
            res.end();
        });
    });
});

router.post(/^\/rooms\/\d+\/messages\/?$/, function (req, res) {
    var roomID = parseInt(req.url.match(/\d+/).join(''));
    var limit = req.body.count || 50;
    var key = req.body.key;

    function cb(loggedIn, user) {
        dbcs.chatRooms.findOne({roomId: roomID}, function (err, room) {
            if (!room) {
                res.status(400);
                res.send(JSON.stringify({
                    error: 'Room not found'
                }));
                res.end();
                return;
            }
            var returnObj = [];
            res.status(200);
            var found = 0;
            dbcs.chatMessages.find({roomId: roomID}).skip(limit).each(function (error, message) {
                if (!message || found === limit) {
                    res.send(JSON.stringify(returnObj));
                    res.end();
                    return;
                }
                console.log(message);
                var items = {
                    content: message.text,
                    senderName: message.senderName,
                    senderImg: message.senderImgURL,
                    id: message.id
                };
                if (loggedIn) {
                    items.starred = message.starrers.indexOf(user) != -1;
                }
                returnObj.push(items);
                found++;
            });
        })
    }

    if (!key) {
        cb(false);
    } else
        dbcs.chatUsers.findOne({key: key}, function (err, user) {
            if (!user) {
                res.status(400);
                res.send(JSON.stringify({
                    error: 'Invalid key!'
                }));
                res.end();
            } else {
                cb(true, user.name);
            }
        });

});


router.post(/\/rooms\/\d+\/users\/?$/, function (req, res) {
    var roomID = parseInt(req.url.match(/\d+/).join(''));
    dbcs.chatUsers.find({rooms: {$in: [roomID]}}, function (err, users) {
        var output = {};
        users.each(function (err, user) {
            if (!!user) {
                output[user.name] = {
                    name: user.name,
                    profileImg: user.imgURL
                }
            } else {
                res.status(200);
                res.send(JSON.stringify(output));
                res.end();
            }

        });
    });
});

router.post(/\/rooms\/\d+\/join\/?$/, function (req, res) {
    var roomID = parseInt(req.url.match(/\d+/).join(''));
    if (!req.body.key) {
        res.status(400);
        res.send(JSON.stringify({
            error: 'No key!'
        }));
        res.end();
        return;
    }
    dbcs.chatUsers.findOne({key: req.body.key}, function (err, user) {
        if (!user) {
            res.status(400);
            res.send(JSON.stringify({
                error: 'Invalid key!'
            }));
            res.end();
            return;
        }
        dbcs.chatRooms.findOne({roomId: roomID}, function (err, room) {
            if (!room) {
                res.status(400);
                res.send(JSON.stringify({
                    error: 'No such room!'
                }));
                res.end();
                return;
            }
            if (user.rooms.indexOf(roomID) == -1) {
                user.rooms.push(roomID);
                dbcs.chatUsers.save(user, {safe: true}, function () {
                });
                broadcastWSEvent(roomID, JSON.stringify({
                    eventType: 2,
                    user: user.name,
                    userImgURL: user.imgURL
                }));
            }
            res.status(200);
            res.send(JSON.stringify({
                result: 'Ok'
            }));
            res.end();
        });
    });
});


router.post(/\/rooms\/\d+\/leave\/?$/, function (req, res) {
    var roomID = parseInt(req.url.match(/\d+/).join(''));
    if (!req.body.key) {
        res.status(400);
        res.send(JSON.stringify({
            error: 'No key!'
        }));
        res.end();
        return;
    }
    dbcs.chatUsers.findOne({key: req.body.key}, function (err, user) {
        if (!user) {
            res.status(400);
            res.send(JSON.stringify({
                error: 'Invalid key!'
            }));
            res.end();
            return;
        }
        dbcs.chatRooms.findOne({roomId: roomID}, function (err, room) {
            if (!room) {
                res.status(400);
                res.send(JSON.stringify({
                    error: 'No such room!'
                }));
                res.end();
                return;
            }

            if (user.rooms.indexOf(roomID) != -1) {
                user.rooms.splice(user.rooms.indexOf(roomID), 1);
                dbcs.chatUsers.save(user, {safe: true}, function () {
                });
                broadcastWSEvent(roomID, JSON.stringify({
                    eventType: 3,
                    user: user.name
                }));
            }
            res.status(200);
            res.send(JSON.stringify({
                result: 'Ok'
            }));
            res.end();
        });
    });
});

var allowedUsersToBroadCast = [
    'eyeballcode'
];

router.get('/messages/broadcast/', function (req, res) {
    function throw404() {
        var err = new Error('Not found');
        err.status = 404;
        throw err;
    }

    // Only allow me (Eyeballcode) to broadcast things, haha
    if (!req.session.user || allowedUsersToBroadCast.indexOf(req.session.user.name.toLowerCase()) === -1) {
        throw404();
    } else {
        if (res.userAgent.indexOf('mobile') != -1) {
            // Handle mobile someday
            res.status(400);
            res.send('Error: You must use a computer to broadcast. Sorry about that :(');
            res.end();
        } else {
            res.render('computer/chat/broadcast');
        }
    }
});

router.post('/messages/broadcast/', function (req, res) {
    function throw404() {
        var err = new Error('Not found');
        err.status = 404;
        throw err;
    }

    if (!req.session.user || allowedUsersToBroadCast.indexOf(req.session.user.name.toLowerCase()) === -1) {
        throw404();
    } else
        dbcs.chatRooms.find({}, function (e, rooms) {
            rooms.each(function (e, room) {
                if (!!room) {
                    broadcastWSEvent(room.roomId, JSON.stringify({
                        eventType: 1000,
                        message: req.body.message
                    }));
                } else {
                    res.render('computer/chat/broadcast');
                }
            });
        });
});

router.post(/^\/rooms\/\d+\/stars$/, function (req, res) {
    var id = parseInt(req.url.split(/^\/rooms\/(\d+)\/stars$/)[1]);
    dbcs.chatRooms.findOne({roomId: id}, function (err, room) {
        if (!room) {
            res.status(400);
            res.send(JSON.stringify({
                error: 'No such room!'
            }));
            res.end();
        } else {
            var limit = parseInt(req.body.limit) || 50;
            dbcs.chatMessages.find({roomId: id, starred: true}, function (err, messages) {
                res.status(200);
                res.write('[');
                messages.limit(limit).each(function (err, message) {
                    if (!message) {
                        res.write(']');
                        res.end();
                    } else {
                        res.write(JSON.stringify({
                                id: message.id,
                                content: message.text,
                                user: message.senderName
                            }) + ', ');
                    }
                });
            });
        }
    });
});

router.post(/^\/messages\/\d+\/star$/, function (req, res) {
    var id = req.url.split(/^\/messages\/(\d+)\/star$/)[1];
    dbcs.chatUsers.findOne({key: req.body.key}, function (err, user) {
        if (!user) {
            res.status(400);
            res.send(JSON.stringify({
                error: 'Invalid key!'
            }));
            res.end();
            return;
        }
        dbcs.chatMessages.findOne({id: parseInt(id)}, function (err, message) {
            if (message.starrers.indexOf(user.name) == -1) {
                message.starred = true;
                message.starCount += 1;
                message.starrers.push(user.name);
            } else if (message.starrers.indexOf(user.name) != -1) {
                //Unstar
                message.starCount -= 1;
                message.starred = message.starCount === 0;
                message.starrers.pop(message.starrers.indexOf(user.name));
            }
            dbcs.chatMessages.save(message, {safe: true});
            res.status(200);
            res.end();
        });
    });
});

module.exports = router;