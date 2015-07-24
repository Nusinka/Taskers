var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    defaults: {
        links: []
    },
    initialize: function (attrs, opts) {
        if (opts && opts.urlRoot) {
            this.urlRoot = opts.urlRoot;
        }
    }
});

exports.Model = Model;

var Collection = Backbone.Collection.extend({
    model: Model,
    initialize: function (models, opts) {
        this.url = opts.url;
    }
});
exports.Collection = Collection;