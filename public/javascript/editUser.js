$(function () {
    $('#editForm').submit(function (e) {
        if (!$('#password').val().match(/\d/)) {
            alert('Password must contain at least 1 number');
            e.preventDefault();
            return false;
        }
        if (!$('#password').val().match(/[!@#\$%^&*\()\{}\[\]|\\;:'",\./?<>~`\-_+=]/)) {
            alert('Password must contain at least 1 special character');
            e.preventDefault();
            return false;
        }
    });

    function checkStrength() {
        //We use the password in #password
        var strength = passStrength($('#password').val());
        $('#passwordStrength').css('width', strength);
    }

    $('#password').on('keydown, keyup, input', checkStrength);
    $('#password2').on('keydown, keyup, input', checkStrength);

    $('#aboutMe').on('input', function () {
        $('#output').html(markdown($('#aboutMe').val()));
    });

    $('#output').html(markdown($('#aboutMe').val()));

    Mousetrap($('#aboutMe')[0]).bind(['command+enter', 'ctrl+enter'], function () {
        console.log('Hi');
        $('#submit').click();
    });

});