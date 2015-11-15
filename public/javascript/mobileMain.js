$(function () {

    $(document).swipeleft(function () {
        if ($('#sidebar-left').attr('data-showing') === 'true') {
            $('#dropdown').click();
        }
    }).swiperight(function (e) {
        if ($('#sidebar-left').attr('data-showing') === 'false') {
            if (e.swipestart.coords[0] < 100)
                $('#dropdown').click();
        }
    });

    $('#dropdown').touch(function (e) {
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
                $('#dropdown').touch();
            }));
        }
        else {
            $('#sidebar-left').stop().animate({
                left: -300
            }, 700).attr('data-showing', 'false');
            $('#display-block').remove();
        }

    });

});