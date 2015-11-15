var express = require('express');
var router = express.Router();

/* GET / */
router.get('/', function (req, res, next) {
    res.status(200);
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/index', {title: 'Team Free Hugs'});
});

router.get('/500', function () {
    throw new Error('Force 500 page');
});


module.exports = router;
