var _ = require('lodash'),
    Backbone = require('backbone'),
    tasks = require('../common/models'),
    moment = require('moment');

module.exports = Backbone.View.extend({
    tpls: {
        main: _.template(require('./main.tpl.html')),
        row: _.template(require('./row.tpl.html')),
        form: _.template(require('../task/task-form.tpl.html'))
    },

    initialize: function (opts) {
        this.$el.append(this.tpls.main());
        this.data = {
            users: opts.users,
            priors: opts.priors,
            statuses: opts.statuses.toJSON()
        };
        this.dataURL = opts.dataURL;

        this.collection = new tasks.Collection([], {
            url: opts.dataURL
        });
        this.listenTo(this.collection, "add", this.renderTask);
    },

    show: function (id) {
        if (id > 0) {
            this.$('button.new-task').addClass('hidden');
        } else {
            this.$('button.new-task').removeClass('hidden');
        }
        this.collection.url = this.dataURL + (id ? '/' + id : '');
        this.$('tbody').empty();
        this.collection.fetch({
            reset: true,
            silent: false
        });
    },

    renderTask: function (task) {
        var data = task.toJSON(),
            now = moment(),
            due = moment(data.due_date),
            left = due.diff(now, 'hours'),
            id = data.priority_id;
        _.extend(data, {
            priority: this.data.priors.get(id).get('priority'),
            created: moment(data.created_date).format('DD.MM.YYYY HH:mm'),
            left: left
        });
        this.$('tbody').append(this.tpls.row(data));
    },

    editTask: function (evt) {
        evt.preventDefault();
        this.trigger('go', evt.currentTarget.getAttribute('href'));
        return;
    },

    /*********************************/
    /*        Create New Task        */
    /*********************************/
    openTaskForm: function () {
        var now = moment(),
            role = 'c',
            created = moment(now, 'YYYY-MM-DD HH:mm:ss');

        this.newTask = new tasks.Model({
            created: created.format('DD.MM.YYYY')
        }, {
            collection: this.collection
        });

        this.$('#taskForm .modal-body').empty()
            .append(this.tpls.form({
                task: this.newTask.toJSON(),
                users: this.data.users.toJSON(),
                priors: this.data.priors.toJSON(),
                statuses: [this.data.statuses[0]],
                guest: role === 'g'
            }));
        this.$('#taskForm').modal();
        this.$('form#files').hide();
    },

    createTask: function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        var data = this.$('form#assignment').serializeArray().reduce(function (obj, param) {
            obj[param.name] = param.value;
            return obj;
        }, {});
        this.newTask.save(data, {
            wait: true,
            success: function () {
                this.newTask = null;
            }.bind(this)
        });
        this.$('#taskForm').modal('hide');
        this.collection.fetch();
    },

    addLink: function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        if (!this.newTask) { return; }

        var link = this.$('#links').serializeArray().reduce(function (obj, param) {
            obj[param.name] = param.value;
            return obj;
        }, {});
        this.$('#listLinks').append('<li><a href="' + link.link + '">' + link.linkTitle + '</a></li>');
        
        this.$('input#linkTitle').val('');
        this.$('input#linkUrl').val('');
        this.newTask.get('links').push(link);
    },
    /*********************************/
    /*      End Of Create New Task   */
    /*********************************/

    events: {
        'submit #links': 'addLink',
        'submit #assignment': 'createTask',
        'click tbody a': 'editTask',
        'click .new-task': 'openTaskForm'
    }
});
