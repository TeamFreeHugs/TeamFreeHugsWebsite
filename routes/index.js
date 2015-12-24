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

router.get('/500', function (req, res, next) {
    next(new Error('Force 500 page'));
});


module.exports = router;
