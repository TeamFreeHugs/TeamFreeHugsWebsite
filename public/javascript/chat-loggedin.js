function key() {
    return $('#key').val();
}

$(function () {
    var roomID = parseInt(location.pathname.match(/\d+/)[0]);
    $('#send').click(function () {
        if ($('#messageInput').val()) {
            $.ajax({
                type: 'POST',
                url: '/chat/rooms/' + roomID + '/messages/add',
                data: {
                    text: $('#messageInput').val(),
                    key: key()
                }
            }).done(function () {
                $('#messageInput').val('')
            });
        }
    });

    $('#messageInput').keydown('ctrl+enter', function (e) {
        $('#send').click();
    });
    $('#messageInput').on('keydown', function (e) {
        setTimeout(function () {
            var cursor = $('#messageInput')[0].selectionStart;
            var parts = $('#messageInput').val().substr(0, cursor).split(/ /);
            var stop = parts.length - 1;
            parts = $('#messageInput').val().split(/ /);
            var currentWord = parts[stop];
            if (currentWord.startsWith('@')) {
                $('#pingPopup > *').each(function (i, e) {
                    $(e).remove();
                });
                var totalWidth = 0;
                CHAT.roomUsers.forEach(function (user) {
                    if (canStringPingUser(currentWord, user.name)) {
                        var nameLength = parseInt(getComputedStyle($('#calcTxtWidth').text(user.name)[0]).width.match(/\d+/));
                        $('#pingPopup').append($('<div>').append(
                            $('<img>').attr('src', user.profileImg).attr('width', 32).attr('height', 32).css({
                                position: 'absolute',
                                top: '50%',
                                transform: 'translateY(-50%)'
                            })
                        ).append(
                            $('<a>').attr('href', '#').text(user.name).css({
                                display: 'inline-block',
                                'padding-bottom': '5px',
                                position: 'relative',
                                top: '50%',
                                transform: 'translateY(25%)',
                                left: '35px'
                            }).click(function (e) {
                                e.preventDefault();
                            })
                        ).click(function () {
                            parts[stop] = '@' + user.name;
                            var now = parts.slice(0, stop + 1).join(' ').length;
                            var whole = parts.join(' ');
                            $('#messageInput')[0].focus();
                            $('#messageInput').val(whole);
                            $('#pingPopup').hide();
                            $('#pingPopup > *').each(function (i, e) {
                                $(e).remove();
                            });
                            $('#messageInput')[0].selectionStart = $('#messageInput')[0].selectionEnd = now;
                        }).css({
                            display: 'inline-block',
                            width: nameLength + 40 + 'px',
                            left: totalWidth
                        })).show();
                        totalWidth += nameLength + 35;
                    }
                });
            } else {
                $('#pingPopup').hide();
                $('#pingPopup > *').each(function (i, e) {
                    $(e).remove();
                });
            }
        }, 10);
    });
    var waiting = setInterval(function () {
        if (CHAT.ws.readyState === WebSocket.prototype.OPEN) {
            $.ajax({
                type: 'POST',
                url: '/chat/rooms/' + CHAT.room.id + '/join',
                data: {key: key()}
            });
            clearInterval(waiting);
        }
    }, 2000);
    if (Notification.permission !== "granted")
        Notification.requestPermission();
});