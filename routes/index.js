var express = require('express');
var router = express.Router();

/* GET / */
router.get('/', function (req, res, next) {
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/index', {title: 'Team Free Hugs'});
});




module.exports = router;
