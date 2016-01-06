var SMTPServer = require('smtp-server').SMTPServer;
var fs = require('fs');

var options = {
    name: 'Team Free Hugs',
    onAuth: function (auth, session, callback) {
        if (auth.username !== 'abc' || auth.password !== 'def') {
            return callback(new Error('Invalid username or password'));
        }
        callback(null, {user: 123});
    }
};

var args = process.argv.slice(2);
if (args.indexOf('--port') == -1) {
    options.secure = false;
    global.smtpServer = new SMTPServer(options);
    smtpServer.listen(465);
} else {
    options.key = fs.readFileSync(__dirname + '../https/server.key');
    options.cert = fs.readFileSync(__dirname + '../https/server.crt');
    options.secure = true;
    global.smtpServer = new SMTPServer(options);
    smtpServer.listen(25);
}