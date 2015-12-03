$(function () {
    var typingTimer;
    var doneTypingInterval = 1400;
    var $input = $('#searchBar');
    $input.on('keyup', function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    });
    $input.on('keydown', function () {
        clearTimeout(typingTimer);
    });
    $('#queryType').change(doneTyping);
    doneTyping();
    function doneTyping() {
        var $input = $('#searchBar');
        $('.usersResult > *').remove();
        var req = $.ajax({
            type: 'POST',
            url: '/users/find',
            data: {
                query: $input.val(),
                type: $('#queryType :selected').attr('data-type')
            }
        }).done(function (data) {
            $('.usersResult > *').remove();
            console.log(JSON.stringify(data));
            data.forEach(function (user) {
                $('.usersResult').append(
                    $('<div>').attr('class', 'userCard').append(
                        $('<img>').attr('src', user.imgURL).attr('class', 'userCardImg')
                    ).append(
                        $('<a>').text(user.name).attr('href', '/users/user/' + user.name).attr('class', 'userCardLink')
                    )
                );
            });
        });
    }
});
