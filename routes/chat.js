var express = require('express');
var router = express.Router();

/* GET /chat/ */
router.get('/', function (req, res) {
    res.render((res.userAgent.indexOf('mobile') === -1 ? 'computer' : 'mobile') + '/chat', {title: 'Team Free Hugs Chat'});
});


module.exports = router;
