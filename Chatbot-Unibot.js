var ChatAPI = require('./modules/JS-TFHCAPI');
var mongo = require('mongodb').MongoClient;

var unibot;
mongo.connect('mongodb://localhost:27017/TFHWebSite', {}, function (err, db) {
    var users = db.collection('users');
    users.findOne({name: 'UniBot'}, function (err, unibot2) {
        unibot = unibot2;
    });
});
module.exports = function (id) {
    new ChatAPI('UniBot', unibot.realPass, 'localhost:3000', function (client) {
        //console.log(client);
        client.getRoom(id, function (err, room) {
            room.join();
            room.watch(function (event) {
                if (event.getType() === 1) {
                    if (event.getContent().startsWith('!!/')) {
                        console.log(event.getContent());
                    }
                }
            });
        });
    });
};