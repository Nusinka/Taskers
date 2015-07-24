'use strict';
const Router = require('koa-router');
const router = new Router();
const _ = require('lodash');
const FSM = require('../lib/fsm');
const fs = require('fs');
const path = require('path');
const koaBody = require('koa-body')({
    multipart: true
});



router.use(function* (next) {
    if (!this.session.user) {
        this.redirect('/');
        this.status = 301;
        return;
    }

    yield next;
});

router.get('/:owner(me|my)/:userId?', function* () {
    const user = this.params.owner == 'my' ? 'assignee_id' : 'creator_id';

    let userId = this.params.userId|0;
    userId = userId ? userId : this.session.user.id;

    this.body = yield this.db('tasks').where(user, userId);
});

router.post('/:owner(me|my)/:userId?', function* () {
    const role = 'c';
    const task = {
        title: this.request.body.title,
        due_date: this.request.body.dueDate,
        status_id: this.request.body.status,
        priority_id: this.request.body.priority,
        creator_id: this.session.user.id,
        assignee_id: this.request.body.assignee,
        details: this.request.body.details
    };

    const info = yield this.db.select('status').table('status')
        .where({id: task.status_id});
    const status = info[0].status;

    this.assert(status === 'new', 400, 'Wrong status value');

    task.id = (yield this.db('tasks').insert(task))[0];

    task.links = [];

    const links = this.request.body.links.map(function (link) {
        const l = {
            link_title: link.linkTitle,
            link_url: link.link,
            task_id: task.id
        };
        task.links.push(l);
        return this.db('links').insert(l);
    }, this);

    if (links.length) {

        const linksIds = yield links;
        linksIds.forEach(function (lId, idx) {
            task.links[idx].id = lId[0];
        });
    }

    this.body = JSON.stringify(task);
});

router.get('/:id', function* () {
    const userId = this.session.user.id;

    const task = (yield this.db('tasks').join('users', 'tasks.creator_id', '=', 'users.id')
        .select('tasks.*', 'users.email').where('tasks.id', this.params.id))[0];

    task.links = [];

    const linksArr = yield this.db('links').where('task_id', task.id);
    const data = linksArr.map(function (link) {
        return task.links.push(link);
    });

    task.files = [];

    const filesArr = yield this.db('files').where('task_id', task.id);

    const dataF = filesArr.map(function (file) {
        return task.files.push(file);
    });

    task.user = userId;
    this.body = task;
});

router.put('/:id', function* () {
    const userId = this.request.body.user;
    const task = {
        id: this.request.body.id,
        title: this.request.body.title,
        due_date: this.request.body.dueDate,
        status_id: this.request.body.status,
        priority_id: this.request.body.priority,
        assignee_id: this.request.body.assignee,
        details: this.request.details
    };

    const data = (yield this.db('tasks').where('tasks.id', task.id))[0];
    const statuses = yield this.db('status');

    let role = (userId == data.assignee_id) ? 'a' : 'g';
    role = (userId == data.creator_id) ? 'c': role;

    const currentStatus = _.find(
        statuses, {id: data.status_id}).status;

    const nextStatus = _.find(
        statuses, {id: parseFloat(task.status_id)});

    const fsm = new FSM(currentStatus);
    const canStatus = nextStatus.status == currentStatus || fsm.can(nextStatus.status, role);

    this.assert(canStatus, 400, "Wrong status value");

    yield this.db('tasks').update(task).where('id', task.id);

    task.links = [];

    const links = this.request.body.links.map(function (link) {
        const l = {
            link_title: link.linkTitle,
            link_url: link.link,
            task_id: task.id
        };
        task.links.push(l);
        return this.db('links').insert(l);
    }, this);

    if (links.length) {

        const linksIds = yield links;
        linksIds.forEach(function (lId, idx) {
            task.links[idx].id = lId[0];
        });
    }
});

router.del('/rmlink/:id', function* () {
    const link = yield this.db('links').where('id', this.params.id).del();
    this.body = link;
});

function fsMove(src, dst) {
    return new Promise(function(res, rej) {
        const is = fs.createReadStream(src);
        const os = fs.createWriteStream(dst);
        is.pipe(os);
        is.on('end', function () {
            fs.unlink(src, function (err) {
                if (err) {
                    return rej(err);
                }
                res(true);
            });
        });
    });
}

router.post('/upload', koaBody, function* () {
    let result = [];
    let files = this.request.body.files.file;
    const taskId = this.request.body.fields.task_id;
    files = Array.isArray(files) ? files : [files];
    for (let i = 0; i < files.length; i++) {
        const fileName = Math.round(Math.random() * 100000).toString('16') +
                path.extname(files[i].name);
        const filePath = path.join('./public/files/', fileName);
        const fileUrl = path.join('/files/', fileName);

        yield fsMove(files[i].path, filePath);

        const data = {
            task_id: taskId,
            file_name: files[i].name,
            file_path: filePath,
            file_url: fileUrl
        };
        yield this.db('files').insert(data);
        result.push(data);
    }
    console.log(result);
    this.body = result;
});

router.del('/rmfile/:id', function* () {
    const file = yield this.db('files').where('id', this.params.id).del();
    this.body = file;
});

module.exports = router.routes();
