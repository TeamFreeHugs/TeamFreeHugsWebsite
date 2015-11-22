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
                CHAT.roomUsers.forEach(function (user) {
                    if (canStringPingUser(currentWord, user.name)) {
                        $('#pingPopup').append($('<div>').append(
                            $('<img>').attr('src', user.profileImg)
                        ).append(
                            $('<a>').attr('href', '#')
                        ).click(function () {
                            parts[stop] = '@' + user.name;
                            var whole = parts.join(' ');
                            $('#messageInput').val(whole);
                            console.log(whole);
                            $('#pingPopup').hide();
                            $('#pingPopup > *').each(function (i, e) {
                                $(e).remove();
                            });
                        })).show();
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
    setTimeout(function () {
        $.ajax({
            type: 'POST',
            url: '/chat/rooms/' + CHAT.room.id + '/join',
            data: {key: key()}
        });
    }, 2000);
});