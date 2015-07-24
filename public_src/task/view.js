var Backbone = require('backbone'),
    _ = require('lodash'),
    Task = require('../common/models').Model,
    moment = require('moment'),
    swal = require('sweetalert'),
    FSM = require('../../lib/fsm'),
    swalcss = require('sweetalert/dist/sweetalert.css');

var TaskView = Backbone.View.extend({
    tpls: {
        main: _.template(require('./main.tpl.html')),
        form: _.template(require('./task-form.tpl.html'))
    },

    initialize: function (opts) {
        this.data = {
            users: opts.users.toJSON(),
            priors: opts.priors.toJSON(),
            statuses: opts.statuses.toJSON()
        };
        this.setElement(this.tpls.main());
    },

    show: function (taskId) {
        this.$('div.form-actions').show();
        this.task = new Task({ id: taskId }, { urlRoot: '/api/task'});
        this.task.fetch({
            success: this._loaded.bind(this)
        });
    },

    _loaded: function (task) {
        var data = task.toJSON(),
            now = moment(),
            created = moment(data.created_date, "YYYY-MM-DD HH:mm Z"),
            due = moment(data.due_date, "YYYY-MM-DD HH:mm Z"),
            currentStatus = _.find(
            this.data.statuses, {id: task.get('status_id')}).status,
            role;

        role = (data.user == data.assignee_id) ? 'a' : 'g';
        role = (data.user == data.creator_id) ? 'c': role;

        var fsm = new FSM(currentStatus);

        this.$el.find('#taskBody').empty()
            .append(this.tpls.form({
                task: _.extend(data, {
                    created: moment(data.created_date).format('DD.MM.YYYY'),
                    spent: now.diff(created, 'hours'),
                    due: moment(due).format('YYYY-MM-DDTHH:mm'),
                    left: due.diff(now, 'hours')
                }),
                users: this.data.users,
                priors: this.data.priors,
                statuses: this.data.statuses.filter(function (s) {
                    return s.status == currentStatus || fsm.can(s.status, role);
                }),
                guest: role === 'g'
            }));

        if (role == 'g') {
            this.$('div.form-actions').hide();
        }

    },

    changeTask: function (evt) {
        evt.preventDefault();
        var data = this.$('#assignment').serializeArray(),
            params = data.reduce(function (obj, param) {
                obj[param.name] = param.value;
                return obj;
            }, {});

        params.links = this.tpmLinks;
        this.task.save(params, {
            error: function (model, response) {
                this.$('#statusDiv').addClass('has-error');
            }
        });
        this.tpmLinks = null;
        console.log('TYT');
        window.location = 'http://localhost:8080/dashboard';
    },

    addLink: function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this.tpmLinks = this.tpmLinks || [];
        
        var link = this.$('#links').serializeArray().reduce(function (obj, param) {
            obj[param.name] = param.value;
            return obj;
        }, {});
        this.$('#listLinks').append('<li><a href="#"><span class="glyphicon glyphicon-trash" style="color: #337ab7;"></span></a><a href="' + link.link + '">' + link.linkTitle + '</a></li>');
        
        this.$('input#linkTitle').val('');
        this.$('input#linkUrl').val('');
        
        this.tpmLinks.push(link);
    },

    removeLink: function (evt) {
        evt.preventDefault();
        var id = this.$(evt.currentTarget).data('id');
        swal({
            title: "Are you sure?",
            text: "You will not be able to recover this link!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#6b55dd",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, cancel plx!"
        }, function (isConfirm) {
            if (!isConfirm) {
                return;
            }
            $.ajax({
                url: "/api/task/rmlink/" + id,
                type: 'DELETE',
            }).done(function () {
                this.$('li[data-id=' + id + ']').remove();
            }.bind(this));
        }.bind(this));
    },

    addFile: function (evt) {
        evt.preventDefault();
        evt.stopPropagation();

        var fd = new FormData(this.$('#files')[0]);

        $.ajax({
            url: "/api/task/upload",
            type: 'POST',
            data: fd,
            cache : false,
            processData: false,
            contentType: false
        }).done(function (file) {
            file.forEach(function (file) {
                this.$('#listFiles').append('<li><a href="' + file.file_url + '">' + file.file_name + '</a></li>');
                this.$('#fileName').val('');
            });
        }.bind(this));
    },

    removeFile: function (evt) {
        evt.preventDefault();
        var id = this.$(evt.currentTarget).data('id');
        swal({
            title: "Are you sure?",
            text: "You will not be able to recover this file!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#6b55dd",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, cancel plx!"
        }, function (isConfirm) {
            if (!isConfirm) {
                return;
            }
            $.ajax({
                url: "/api/task/rmfile/" + id,
                type: 'DELETE',
            }).done(function () {
                this.$('li[data-id=' + id + ']').remove();
            }.bind(this));
        }.bind(this));
    },

    events: {
        'submit #links': 'addLink',
        'submit #files': 'addFile',
        'click .btn-save': 'changeTask',
        'click #listLinks .glyphicon-trash': 'removeLink',
        'click #listFiles .glyphicon-trash': 'removeFile'
    }
});

module.exports = TaskView;