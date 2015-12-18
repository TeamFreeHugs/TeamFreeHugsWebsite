var express = require('express');
var fs = require('fs');
var request = require('request');
var router = express.Router();

router.post('/ip', function (req, res) {
    res.status(200);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress);
    res.end();
});

module.exports = router;