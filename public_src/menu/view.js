var Backbone = require('backbone');

var MenuView = Backbone.View.extend({
    el: '#menu',
    goTo: function (evt) {
        evt.preventDefault();
        this.trigger('go', evt.currentTarget.getAttribute('href'));
    },
    logOut: function (evt) {
        $.get('/api/user/logout')
        .done(function () {
            window.location = '/';
        })
        .fail(function () {
            alert('error');
        });
    },
    events: {
        'click #mainMenu a': 'goTo',
        'click #logOut': 'logOut'
    }
});

module.exports = MenuView;