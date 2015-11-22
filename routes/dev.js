var express = require('express');
var router = express.Router();

var md5 = require('md5');

/* GET / */
router.get('/', function (req, res, next) {
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/index', {
        title: 'Team Free Hugs',
        user: req.session.user
    });
});

module.exports = router;
