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


function createChatWS() {
    var ws = new WebSocket('ws://' + location.hostname + ':4000/rooms/' + CHAT.room.id);
    ws.onmessage = function (msg) {
        var data = JSON.parse(msg.data);
        if (data.eventType === 1) {
            addMessage(data.senderName, data.senderImg, data.content, data.messageID, (data.senderName === CHAT.user.name))
            $('.mainChat').scrollTop(99999999999999999);
        } else {
        }
    };
    ws.onerror = function (event) {
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
});