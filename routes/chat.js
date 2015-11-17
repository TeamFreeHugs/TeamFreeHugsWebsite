var express = require('express');
var router = express.Router();

/* GET /chat/ */
router.get('/', function (req, res, next) {
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/chat/index', {title: 'Team Free Hugs Chat'});
});


module.exports = router;
