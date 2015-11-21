function addMessage(sender, senderImg, content, messageID, isOut) {
    $('.mainChat').append(
        $('<div class="messageWrap">').append(
            $('<div class="userCard">').append(
                $('<img width="32" height="32">').attr('src', senderImg)
            ).append(
                $('<a>').text(sender).attr('href', '/users/' + sender)
            )
        ).append(
            $('<div class="messageBubble' + (isOut ? ' messageOut' : '') + '">').attr('id', messageID).html(markdown(content))
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
    var ws = new WebSocket('ws://' + location.hostname + ':4000/rooms/' + CHAT.room.id);
    ws.onmessage = function (msg) {
        var data = JSON.parse(msg.data);
        switch (data.eventType) {
            case 1:
                //New message!
                addMessage(data.senderName, data.senderImg, data.content, data.messageID, (data.senderName === CHAT.user.name))
                // position: absolute is weird
                $('.mainChat').scrollTop(99999999999999999);
                break;
            case 2:
                //User joined
                $('#usersContainer').append(
                    $('<a>').append(
                        $('<img>')
                            .attr('src', data.userImgURL)
                            .attr('width', 32)
                            .attr('height', 32)
                    ).attr('class', 'userIconCard-' + data.user)
                        .attr('title', user.name)
                        .attr('href', '/users/' + data.user)
                );
                break;
            case 3:
                //User left
                $('.userIconCard-' + data.user).remove();
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
        setTimeout(function () {
            ws = createChatWS();
        }, 5000);
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
        $('.mainChat').scrollTop(999);
        $('#blockChat, #chatLoading').remove();
    });

    $.ajax({
        type: 'POST',
        url: '/chat/rooms/' + CHAT.room.id + '/join',
        data: {key: key()}
    }).done(function () {
        $.ajax({
            type: 'POST',
            url: '/chat/rooms/' + CHAT.room.id + '/users'
        }).done(function (data) {
            var users = JSON.parse(data);
            console.log(data);
            for (var user in users) {
                if (users.hasOwnProperty(user)) {
                    user = users[user];
                    window.user = user;
                    console.log(user);
                    $('#usersContainer').append(
                        $('<a>').append(
                            $('<img>')
                                .attr('src', user.profileImg)
                                .attr('width', 32)
                                .attr('height', 32)
                        ).attr('class', 'userIconCard-' + user.name)
                            .attr('title', user.name)
                            .attr('href', '/users/' + user.name)
                    );
                }
            }
        });
    });

});