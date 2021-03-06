function addMessage(sender, senderImg, content, messageID, isOut, starred, isMod, starCount) {
    if (!!CHAT.user.name) {
        var star = $('<span class="messageStar' + (starred ? ' starred' : '') + '">★</span>').attr('id', 'message-' + messageID + '-star').click(function () {
            $.post('/chat/' + $(this).attr('id').replace(/\-/g, '/').replace('message', 'messages'), {key: key()});
        });
        if (!!starCount)
            star.append(' <span style="color: #000">' + starCount + '</span>');
        else
            star.append(' <span style="color: #000">0</span>');
    }
    $('.mainChat').append(
        $('<div class="messageWrap">').append(
            $('<div class="userCard">').append(
                $('<img width="32" height="32">').attr('src', senderImg)
            ).append(
                $('<a>').addClass(isMod ? 'modMessage' : '').text(sender).attr('href', '/users/user/' + sender).css({
                    transform: 'translate(20%, 50%)',
                    position: 'absolute'
                })
            ).css({
                'padding-bottom': '5px'
            })
        ).append(
            $('<div class="messageBubble' + (isOut ? ' messageOut' : '') + '">').attr('id', 'message-' + messageID).html(markdown(content)).append(
                !!star ? star : ''
            )
        ).append($('<hr>'))
    )
}

function showPopupDialog(message) {
    if (!!$('.popup').length) {
        $('.popupClose').click();
        setTimeout(function () {
            showPopupDialog(message);
        }, 1000);
    } else
        $('body').append($('<div>').attr('class', 'popup').append(
            $('<h2>').text(message)).attr('id', 'popupMessage').append(
            $('<a>').text('Click here to close this message').click(function (e) {
                e.preventDefault();
                $('.popup').animate({
                    top: -100
                }, 1000, function () {
                    $('.popup').remove();
                });
            }).attr('class', 'popupClose').attr('href', '#')
        ).animate({
            top: 0
        }, 1000));
}

$(window).blur(function () {
    window.active = false;
}).focus(function () {
    window.active = true;
    window.unreadCount = 0;
    document.title = 'TFHChat: ' + $('.rightBar > h4:nth-child(2)').text()
});

window.active = true;
window.unreadCount = true;

function createChatWS() {
    var ws = new WebSocket('ws://' + location.hostname + ':4000/rooms/' + CHAT.room.id + (!!CHAT.user.name ? '?key=' + key() : ''));
    ws.onmessage = function (msg) {
        var data = JSON.parse(msg.data);
        switch (data.eventType) {
            case 1:
                //New message!
                console.log(data);
                addMessage(data.senderName, data.senderImg, data.content, data.messageID, (data.senderName === CHAT.user.name), false, data.isMod);
                $("html,body").animate({scrollTop: $('.messageWrap').height() * $('.messageWrap').length + 100}, 0);
                if (!window.active) {
                    window.unreadCount++;
                    document.title = '(' + window.unreadCount + ') TFHChat: ' + $('.rightBar > h4:nth-child(2)').text()
                }
                break;
            case 2:
                //User joined
                var toAppend = $('<a>').append(
                    $('<img>')
                        .attr('src', data.userImgURL)
                        .attr('width', 32)
                        .attr('height', 32)
                ).attr('class', 'userIconCard-' + data.user)
                    .attr('title', data.user)
                    .attr('href', '/users/user/' + data.user)
                    .css('opacity', '0');
                if ($('#usersContainer a').get(0))
                    $($('#usersContainer a').get(0)).before(toAppend.animate({
                        opacity: 1
                    }, 1000));
                else
                    $('#usersContainer').append(toAppend.animate({
                        opacity: 1
                    }, 1000));
                break;
            case 3:
                //User left
                $('.userIconCard-' + data.user).animate({
                    opacity: 0
                }, 1000, function () {
                    $('.userIconCard-' + data.user).remove();
                });
                break;
            case 4:
                //Ping, only works if user is logged in. Just check and be safe.
                if (!!CHAT.user.name) {
                    if (Notification.permission === "granted") {
                        var notify = new Notification('You have been pinged!', {
                            icon: '/favicon.png',
                            body: data.content
                        });
                        document.title = '(' + window.unreadCount + '*) TFHChat: ' + $('.rightBar > h4:nth-child(2)').text()
                    }
                }

                break;
            case 5:
                $('#message-' + data.messageID + '-star').html('★ <span style="color: #000">' + data.starCount + '</span>');
                if (!!CHAT.user.name) {
                    var iStarred = data.starred;
                    if (iStarred) $('#message-' + data.messageID + '-star').addClass('starred'); else $('#message-' + data.messageID + '-star').removeClass('starred');
                }
                break;
            case 1000:
                //BROADCASTING!!!
                showPopupDialog('Broadcast message: ' + data.message);
                break;
            case 1001:
                $('#key').val(data.key);
                break;
            default:
                //Unknown eventID, user to reload tab if there are updates
                showPopupDialog('Error: Unknown message received from server. Please reload your tab to try again.');
                break;
        }
    };
    ws.onerror = function () {
        if (CHAT.core.wsRetries > 10) {
            showPopupDialog('Could not connect to the server. Please check your internet connection and reload the page.');
            return;
        }
        CHAT.core.wsRetries++;
        ws = createChatWS();
    };
    return ws;
}


$(function () {
    window.CHAT = {
        room: {
            id: parseInt(location.pathname.match(/\d+/)[0])
        }, user: {
            name: $('#usernameTitle').text().split(/Logged in as ([\w+ ]+)+/)[1]
        }, core: {
            wsRetries: 0
        }, roomUsers: {
            update: function () {
                $.ajax({url: '../users', type: 'POST'}).done(function (data) {
                    data = JSON.parse(data);
                    CHAT.roomUsers.users = data;
                });
            },
            users: {},
            forEach: function (handle) {
                for (var user in CHAT.roomUsers.users) {
                    if (CHAT.roomUsers.users.hasOwnProperty(user)) {
                        handle(CHAT.roomUsers.users[user]);
                    }
                }
            }
        }
    };

    CHAT.ws = createChatWS();
    var op = {
        type: 'POST',
        url: '/chat/rooms/' + CHAT.room.id + '/messages'
    };
    if (CHAT.user.name) {
        op.data = {key: key()};
    }
    $.ajax(op).done(function (data) {
        var messages = JSON.parse(data);
        messages.forEach(function (message) {
            addMessage(message.senderName, message.senderImg, message.content, message.id, (message.senderName === CHAT.user.name), message.starred, message.isMod, message.starCount);
        });
        $("html,body").animate({scrollTop: $('.messageWrap').height() * $('.messageWrap').length + 100}, 0);
        $('#blockChat, #chatLoading').remove();
    });


    $.ajax({
        type: 'POST',
        url: '/chat/rooms/' + CHAT.room.id + '/users'
    }).done(function (data) {
        var users = JSON.parse(data);
        CHAT.roomUsers.users = users;
        for (var user in users) {
            if (users.hasOwnProperty(user)) {
                user = users[user];
                $('#usersContainer').append(
                    $('<a>').append(
                        $('<img>')
                            .attr('src', user.profileImg)
                            .attr('width', 32)
                            .attr('height', 32)
                    ).attr('class', 'userIconCard-' + user.name)
                        .attr('title', user.name)
                        .attr('href', '/users/user/' + user.name)
                );
            }
        }
    });

});