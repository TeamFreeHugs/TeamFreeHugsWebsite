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
});