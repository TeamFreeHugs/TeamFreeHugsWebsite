var express = require('express');
var router = express.Router();

var md5 = require('md5');

/* GET / */
router.get('/', function (req, res, next) {
    var options = {
        title: 'Team Free Hugs',
        user: req.session.user
    };
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/index', options);
});

router.get('/500', function () {
    throw new Error('Force 500 page');
});

module.exports = router;
