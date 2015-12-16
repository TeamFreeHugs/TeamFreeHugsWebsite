var ChatAPI = require('./modules/JS-TFHCAPI');
var mongo = require('mongodb').MongoClient;
var commands = require('./Chatbot-Unibot-Commands');

var unibot;
mongo.connect('mongodb://localhost:27017/TFHWebSite', {}, function (err, db) {
    var users = db.collection('users');
    users.findOne({name: 'UniBot'}, function (err, unibot2) {
        unibot = unibot2;
    });
});
module.exports = function (id) {
    new ChatAPI('UniBot', unibot.realPass, 'localhost:3000', function (client) {
        client.getRoom(id, function (err, room) {
            room.join();
            room.watch(function (event) {
                if (event.getType() === 1) {
                    if (event.getContent().startsWith('!!/') && event.getContent().length > 3) {
                        var parts = event.getContent().split(/!!\/([^ ]+) ?(.+)?/).filter(function (e) {
                            return !!e;
                        }).map(function (e) {
                            return e.trim();
                        });
                        var command = parts[0];
                        var args = parts.slice(1);
                        if (typeof commands[command] !== 'undefined') {
                            commands[command](args, room, event);
                        } else {
                            room.sendMessage('@' + event.getSender().replace(/[ \\|{}\[\];:'",<.>\/?!@#$%^&*\(\)_\-+=]/g, '') + ': Command ' + command + ' is not found.');
                        }
                    }
                }
            });
        });
    });
};