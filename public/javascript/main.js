$(function () {

    //Only for computer, because what phone is so big?
    if ($('body').height() < $(window).height()) {
        $('#footer').css({
            position: 'absolute',
            bottom: 0
        });
    }

    $(document).keydown('esc', function (e) {
        if ($('#sidebar-left').attr('data-showing') === 'true') {
            $('#dropdown').click();
        }
    });

    $('#dropdown').click(function (e) {
        if ($('#sidebar-left').attr('data-showing') === 'false') {
            $('#sidebar-left').stop().animate({
                left: 0
            }, 700).attr('data-showing', 'true');
            $('body').append($('<div>').css({
                'z-index': 100,
                width: '100vw',
                height: '100vh',
                opacity: 0.7,
                display: 'block',
                'background-color': '#C8C8C8',
                position: 'fixed',
                top: 0,
                left: 0
            }).attr('id', 'display-block').click(function () {
                $('#dropdown').click();
            }));
        }
        else {
            $('#sidebar-left').stop().animate({
                left: -300
            }, 700).attr('data-showing', 'false');
            $('#display-block').remove();
        }

    });
    if ($('#usernameTitle').length != 0) {
        $('#usernameTitle').css({
            position: 'relative',
            'margin-left': $('#sidebar-left').width() / 2 - getComputedStyle($('#usernameTitle')[0]).width.match(/\d+/) / 2
        });
    }

    $(document).keydown('ctrl+shift+d', function (e) {
        e.preventDefault();
        $('#dropdown').click();
    });

});