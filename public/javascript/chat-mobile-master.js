function addMessage(sender, senderImg, content, messageID, isOut) {
    $('#mainChat').append(
        $('<div class="messageWrap">').append(
            $('<div class="userCard">').append(
                $('<img width="32" height="32">').attr('src', senderImg)
            ).append(
                $('<a>').text(sender).attr('href', '/users/user/' + sender).css({
                    transform: 'translate(20%, 50%)',
                    position: 'absolute'
                })
            ).css({
                'padding-bottom': '5px'
            })
        ).append(
            $('<div class="messageBubble' + (isOut ? ' messageOut' : '') + '">').attr('id', 'message-' + messageID).html(markdown(content))
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

function createChatWS() {
    var ws = new WebSocket('ws://' + location.hostname + ':4000/rooms/' + CHAT.room.id + (!!CHAT.user.name ? '?key=' + key() : ''));
    ws.onmessage = function (msg) {
        var data = JSON.parse(msg.data);
        switch (data.eventType) {
            case 1:
                //New message!
                addMessage(data.senderName, data.senderImg, data.content, data.messageID, (data.senderName === CHAT.user.name))
                $("#mainChat").scrollTop($('.messageWrap').height() * $('.messageWrap').length + 100);
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
                    }
                }

                break;
            case 1000:
                //BROADCASTING!!!
                showPopupDialog('Broadcast message: ' + data.message);
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
    $.ajax({
        type: 'POST',
        url: '/chat/rooms/' + CHAT.room.id + '/messages'
    }).done(function (data) {
        var messages = JSON.parse(data);
        for (var messageID in messages) {
            if (!messages.hasOwnProperty(messageID))
                continue;
            var message = messages[messageID];
            addMessage(message.senderName, message.senderImg, message.content, messageID, (message.senderName === CHAT.user.name));
        }
        $("#mainChat").scrollTop($('.messageWrap').height() * $('.messageWrap').length + 100);
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
    $(document.body).swipeleft(function (e) {
        if ($('#sidebar-left').attr('data-showing') === 'true') {
            $('#sidebar-left').stop().animate({
                left: -300
            }, 700).attr('data-showing', 'false');
        } else if ($('#sidebar-right').attr('data-showing') === 'false') {
            if (e.swipestart.coords[0] > screen.width / 3 * 2) {
                $('#sidebar-right').stop().animate({
                    right: 0
                }, 700).attr('data-showing', 'true');

            }
        }
        $('#display-block').remove();
    }).swiperight(function (e) {
        if ($('#sidebar-left').attr('data-showing') === 'false' && $('#sidebar-right').attr('data-showing') === 'false') {
            if (e.swipestart.coords[0] < screen.width / 3) {
                $('#sidebar-left').stop().animate({
                    left: 0
                }, 700).attr('data-showing', 'true');
            }
        } else if ($('#sidebar-right').attr('data-showing') === 'true') {
            $('#sidebar-right').stop().animate({
                right: -300
            }, 700).attr('data-showing', 'false');
        }

    });
});