var express = require('express');
var request = require("request");
var jsdom = require("jsdom");
var mongo = require('mongodb').MongoClient;
var router = express.Router();

/* POST /instagram/userID. */
router.post('/userID', function (req, res) {
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
        dbcs.instagramUserID.findOne({name: userName}, function (err, user) {
            if (user && !req.body.cached) {
                res.status(200).send(JSON.stringify({
                    meta: {
                        code: 200
                    }, data: {
                        userID: user.id,
                        userName: userName
                    }
                }));
                res.end();
            } else
                request('http://instagram.com/' + userName, function (error, response, body) {
                    jsdom.env(
                        body,
                        ['http://instagram.com'],
                        function (err, window) {
                            var elements = window.document.querySelectorAll('html body script');

                            eval(elements[2].innerHTML);

                            //noinspection JSUnresolvedVariable
                            if (typeof window._sharedData === 'undefined') {
                                res.status(400).send(JSON.stringify({
                                    meta: {
                                        code: 400,
                                        reason: 'User not found'
                                    }
                                }));
                                res.end();
                            } else {
                                //noinspection JSUnresolvedVariable
                                var userID = window._sharedData.entry_data.ProfilePage[0].user.id;
                                res.status(200).send(JSON.stringify({
                                    meta: {
                                        code: 200
                                    }, data: {
                                        userID: userID,
                                        userName: userName
                                    }
                                }));
                                res.end();
                                dbcs.instagramUserID.insert({
                                    name: userName,
                                    id: userID
                                });
                            }
                        });
                });
            //});

        });
    }
});


/* POST /instagram/mediaID. */
router.post('/mediaID', function (req, res) {
    var mediaID = req.body.mediaID;
    if (typeof mediaID === 'undefined') {
        res.status(400).send(JSON.stringify({
            meta: {
                code: 400,
                reason: 'Media ID not provided'
            }
        }));
        res.end();
    } else {
        request('https://api.instagram.com/oembed?url=http://instagram.com/p/' + mediaID, function (error, response, body) {
            if (body === 'No Media Match') {
                res.status(400).send(JSON.stringify({
                    meta: {
                        code: 400,
                        reason: 'Media Not Found'
                    }
                }));
                res.end();
            } else {
                var json = JSON.parse(body);
                res.status(200).send(JSON.stringify({
                    meta: {
                        code: 200
                    }, data: {
                        mediaID: json.media_id,
                        userName: json.author_name
                    }
                }));
                res.end();
            }
        });
    }
});


/* POST /instagram/postDetails. */
router.post('/postDetails', function (req, res) {
    var mediaID = req.body.mediaID;
    if (typeof mediaID === 'undefined') {
        res.status(400).send(JSON.stringify({
            meta: {
                code: 400,
                reason: 'Media ID not provided'
            }
        }));
        res.end();
    } else {
        request('https://api.instagram.com/oembed?url=http://instagram.com/p/' + mediaID, function (error, response, body) {
            if (body === 'No Media Match') {
                res.status(400).send(JSON.stringify({
                    meta: {
                        code: 400,
                        reason: 'Media Not Found'
                    }
                }));
                res.end();
            } else {
                var json = JSON.parse(body);
                res.status(200).send(JSON.stringify({
                    meta: {
                        code: 200
                    }, data: {
                        mediaID: json.media_id,
                        userName: json.author_name,
                        imageLink: json.thumbnail_url,
                        height: json.thumbnail_height,
                        width: json.thumbnail_width,
                        tite: json.title
                    }
                }));
                res.end();
            }
        });
    }
});
module.exports = router;
