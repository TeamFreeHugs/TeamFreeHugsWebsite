var express = require('express');
var request = require("request");
var jsdom = require("jsdom");
var router = express.Router();

/* POST /instagram/userID. */
router.post('/userID', function (req, res, next) {
    var userName = req.body.userName;
    if (typeof userName === 'undefined') {
        res.status(400).send(JSON.stringify({
            meta: {
                code: 400,
                reason: 'Username not provided'
            }
        }));
        res.end();
    } else {
        request('http://instagram.com/' + userName, function (error, response, body) {
            jsdom.env(
                body,
                ['http://instagram.com'],
                function (err, window) {
                    var elements = window.document.querySelectorAll('html body script');

                    eval(elements[2].innerHTML);

                    if (typeof window._sharedData === 'undefined') {
                        res.status(400).send(JSON.stringify({
                            meta: {
                                code: 400,
                                reason: 'User not found'
                            }
                        }));
                        res.end();
                    } else {
                        res.status(200).send(JSON.stringify({
                            meta: {
                                code: 200
                            }, data: {
                                userID: window._sharedData.entry_data.ProfilePage[0].user.id,
                                userName: userName
                            }
                        }));
                        res.end();
                    }
                });
        });
    }
});


module.exports = router;
