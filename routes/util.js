var express = require('express');
var router = express.Router();

router.post('/ip', function (req, res) {
    res.status(200);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress);
});

module.exports = router;