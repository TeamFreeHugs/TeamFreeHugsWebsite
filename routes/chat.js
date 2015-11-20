var express = require('express');
var WebSocketServer = require('ws').Server;
var url = require('url');

var wsServer = new WebSocketServer({
    port: 4000,
    server: global.server
});

var wsRooms = {};

wsServer.on('close', function close() {
    console.log('disconnected');
});

wsServer.on('close', function (ws) {
    console.log(arguments);
    var location = url.parse(ws.upgradeReq.url, true).path.toString();
    var roomID = parseInt(location.match(/\d+/)[0]);
    wsRooms[roomID].pop(wsRooms[roomID].indexOf(ws));
});


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
                console.log(count);
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

router.post(/\/rooms\/\d+\/messages\/add/, function (req, res) {
    if (!req.body.key) {
        res.status(400);
        res.send(JSON.stringify({
            error: 'No key'
        }));
        res.end();
        return;
    }
    var roomID = parseInt(req.url.match(/rooms\/(\d+)\/messages\/add/)[1]);
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
                sender: user.emailHash,
                senderName: user.name
            });

            res.status(200);
            res.send('');
            res.end();
            dbcs.chatMessages.count(function (e, count) {
                for (var ws in wsRooms[roomID]) {
                    if (wsRooms[roomID].hasOwnProperty(ws)) {
                        if (wsRooms[roomID][ws].readyState === wsRooms[roomID][0].OPEN)
                            wsRooms[roomID][ws].send(JSON.stringify({
                                content: req.body.text,
                                senderName: user.name,
                                senderImg: 'http://www.gravatar.com/avatar/' + user.emailHash,
                                messageID: count
                            }));
                    }
                }
            });
        });
    });
});

router.post(/\/rooms\/\d+\/messages/, function (req, res) {
    var roomID = parseInt(req.url.match(/\d+/)[0]);
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
                senderImg: 'http://www.gravatar.com/avatar/' + message.sender
            };
            found++;
        });
    });
});


module.exports = router;
