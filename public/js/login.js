$(function () {
    $('form.form-signin').submit(function (evt) {
        evt.preventDefault();
        $.post('/api/user/login', $(this).serialize())
            .done(function () {
                window.location = '/dashboard';
            })
            .fail(function () {
                $('form.form-signin p.help-block')
                    .removeClass("help-block")
                    .addClass('has-error');
                $('#inputPassword').val('');
            });
    });
    $('form.form-signup').submit(function (evt) {
        evt.preventDefault();
        $.post('/api/user/register', $(this).serialize())
            .done(function () {
                $('form.form-signup #verify')
                    .removeClass("help-block")
                    .addClass('need-verify');
            })
            .fail(function () {
                $('form.form-signup #message')
                    .removeClass("help-block")
                    .addClass('has-error');
            });
    });
});