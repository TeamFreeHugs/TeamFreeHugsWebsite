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
    if (!!$input.val().trim())
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
            console.log(JSON.stringify(data));
            data.forEach(function (user) {
                $('.usersResult').append(
                    $('<div>').css({
                        width: 500,
                        height: 100,
                        border: '1px solid #000000',
                        display: 'block'
                    }).append(
                        $('<img>').attr('src', user.imgURL).css({
                            width: 80,
                            height: 80,
                            transform: 'translate(12%, 12%)'
                        })
                    ).append(
                        $('<a>').text(user.name).attr('href', '/users/user/' + user.name).css({
                            transform: 'translate(23%, -400%)',
                            display: 'block'
                        })
                    )
                );
            });
        });
    }
});
