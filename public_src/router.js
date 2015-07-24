var Backbone = require('backbone'),
    MenuView = require('./menu/view'),
    DashboardView = require('./dashboard/view'),
    TaskView = require('./task/view'),
    PartView = require('./participants/view');

Backbone.$ = jQuery;

var App = Backbone.Router.extend({
    routes: {
        'dashboard(/)(owner)(/)(:id)': 'desk',
        'created': 'created',
        'participants': 'participants',
        'task/:id': 'task'
    },
    mountView: function (view) {
        if (this._currentMounted) {
            if (typeof this._currentMounted.hide == 'function') {
                this._currentMounted.hide();
            }
            this._currentMounted.undelegateEvents();
        }

        this._currentMounted = this.views[view];
        this.viewEl.empty()
            .append(this._currentMounted.el);

        this._currentMounted.delegateEvents();
        if (typeof this._currentMounted.show == 'function') {
            this._currentMounted.show.apply(
                this._currentMounted, Array.prototype.slice.call(arguments, 1));
        }
    },
    data: {
        users: new Backbone.Collection(),
        priors: new Backbone.Collection(),
        statuses: new Backbone.Collection()
    },
    start: function () {
        this.views = {
            menu: new MenuView(),
            desk: new DashboardView({
                users: this.data.users,
                priors: this.data.priors,
                statuses: this.data.statuses,
                dataURL: '/api/task/my'
            }),
            created: new DashboardView({
                users: this.data.users,
                priors: this.data.priors,
                statuses: this.data.statuses,
                dataURL: '/api/task/me'
            }),
            task: new TaskView({
                users: this.data.users,
                priors: this.data.priors,
                statuses: this.data.statuses
            }),
            participants: new PartView({
                users: this.data.users
            })
        };
        function go(route) {
            this.navigate(route, {
                trigger: true
            });
        }

        this.listenTo(this.views.menu, 'go', go);
        this.listenTo(this.views.desk, 'go', go);
        this.listenTo(this.views.created, 'go', go);
        this.listenTo(this.views.task, 'go', go);
        this.listenTo(this.views.participants, 'go', go);
        this.viewEl = Backbone.$('#changeBox');

        Backbone.history.start({
            pushState: true
        });
    },
    desk: function (id) {
        this.mountView('desk', id|0);
    },
    created: function () {
        this.mountView('created');
    },
    participants: function () {
        this.mountView('participants');
    },
    task: function (id) {
        this.mountView('task', id|0);
    },
    setData: function (name, data) {
        this.data[name].reset(data);
    }
});

module.exports = App;
