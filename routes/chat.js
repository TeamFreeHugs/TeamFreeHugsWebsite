var express = require('express');
var WebSocketServer = require('ws').Server;
var url = require('url');
var wsServer = new WebSocketServer({
    port: 4000,
    server: global.server
});

var wsRooms = {};

wsServer.on('connection', function (ws) {
    var location = url.parse(ws.upgradeReq.url, true).path.toString();
    if (location.match(/\/rooms\/\d+/)) {
        var roomID = parseInt(location.match(/\d+/)[0]);
        dbcs.chatRooms.findOne({roomId: roomID}, function (err, room) {
            if (!room) {
                ws.send(JSON.stringify({
                    error: 'No such room!'
                }));
                ws.close();
                return;
            }
            if (!wsRooms[roomID])
                wsRooms[roomID] = [];
            wsRooms[roomID].push(ws);
        });
    }
});


var router = express.Router();

/* GET /chat/ */
router.get('/', function (req, res) {
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
            });

        });
    });

});

function getRoomName(realName) {
    return realName.trim().toLowerCase().replace(/ +/g, '-').replace(/[!@#\$%^&*\()\{}\[\]|\\;:'",\./?<>~`_+=]/g, '');
}

router.get('/rooms', function (req, res) {
    //res.status(200);
    dbcs.chatRooms.find(function (error, rooms) {
        var found = 0;
        rooms.each(function (err, room) {
            if (!room) {
                res.end();
                return;
            }

            if (found > 10) {
                res.end();
                return;
            }

            //noinspection HtmlUnknownTarget
            var toSend = "<div class='roomcard' id='roomcard-" + found + "'>" +
                "<h3><a style='text-decoration: none;' href='/chat/rooms/" + found + "/" + getRoomName(room.name) + "/'>" + room.name + "</a></h3>" +
                "<small style='margin-left: 10px;'>" + room.description + "</small>" +
                "</div>";
            res.write(toSend);
            found++;
        });
    });

});

router.get(/\/rooms\/\d+(?:\/(?:\w+|\-)+)?/, function (req, res) {
    if (req.url.match(/rooms\/\d+/)) {
        dbcs.chatRooms.findOne({roomId: parseInt(req.url.split(/rooms\/(\d+)/)[1])}, function (e, room) {
            if (!room) {
                //Room doesn't exist
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
                            emailHash: user.emailHash,
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
            dbcs.chatMessages.insert({
                roomId: roomID,
                text: req.body.text,
                senderImgURL: user.imgURL,
                senderName: user.name
            });

            res.status(200);
            res.send('');
            res.end();
            dbcs.chatMessages.count(function (e, count) {
                broadcastWSEvent(roomID, JSON.stringify({
                    eventType: 1,
                    content: req.body.text,
                    senderName: user.name,
                    senderImg: user.imgURL,
                    messageID: count
                }));
            });
        });
    });
});

router.post(/\/rooms\/\d+\/messages\/?$/, function (req, res) {
    var roomID = parseInt(req.url.match(/\d+/).join(''));
    dbcs.chatMessages.find({roomId: roomID}, function (error, messages) {
        var found = 0;
        var limit = req.body.count || 50;
        res.status(200);
        var returnObj = {};
        messages.each(function (err, message) {
            if (!message || found === limit) {
                res.send(JSON.stringify(returnObj));
                res.end();
                return;
            }
            returnObj['message-' + found] = {
                content: message.text,
                senderName: message.senderName,
                senderImg: message.senderImgURL
            };
            found++;
        });
    });
});

router.post(/\/rooms\/\d+\/users\/?$/, function (req, res) {
    var roomID = parseInt(req.url.match(/\d+/).join(''));
    dbcs.chatUsers.find({rooms: {$in: [roomID]}}, function (err, users) {
        var output = {};
        users.count(function (e, count) {
            var found = 0;
            users.each(function (err, user) {
                if (found <= count && user) {
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
            rooms.count(function (e, count) {
                count--;
                var found = 0;
                rooms.each(function (e, room) {
                    if (found <= count && !!room) {
                        broadcastWSEvent(room.roomId, JSON.stringify({
                            eventType: 1000,
                            message: req.body.message
                        }));
                        found++;
                    } else {
                        res.render('computer/chat/broadcast');
                    }
                });
            });
        });
});

module.exports = router;