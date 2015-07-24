var Backbone = require('backbone'),
    _ = require('lodash');

var PartView = Backbone.View.extend({
    template: _.template(require('./main.tpl.html')),

    initialize: function (opts) {
        this.data = {
            users: opts.users
        };
        this.setElement(this.template());
    },

    show: function () {
        body = this.$('tbody').empty();
        this.data.users.forEach(function (element, index, array) {
            var id = element.toJSON().id;
            this.$('<a href="/dashboard/owner/' + id + '"></a>')
                .appendTo('tbody')
                .text(element.toJSON().email)
                .wrap('<tr></tr>')
                .wrap('<td></td>');
        });
    },

    editTask: function (evt) {
        evt.preventDefault();
        this.trigger('go', evt.currentTarget.getAttribute('href'));
    },

    events: {
        'click tbody a': 'editTask'
    }
});

module.exports = PartView;