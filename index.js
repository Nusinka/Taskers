'use strict';
const app = require('koa')();
const Router = require('koa-router');
const render = require('koa-swig');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static');
const session = require('koa-generic-session');
const redisStore = require('koa-redis');
const mount = require('koa-mount');
const _ = require('lodash');
const knex = require('knex')({
    client: 'mysql',
    connection: {
        user     : 'root',
        database : 'taskers'
    }
});
const port = 8080;

app.context.db = knex;

app.use(bodyParser());

app.use(serve('public'));

app.keys = ['x r5e34>OKJGJGHFGHJ'];

app.use(session({
    store: redisStore()
}));


app.context.render = render({
    cache: false
});

function* checkAuth(next) {
    if (!this.session.user) {
        this.redirect('/');
    }
    this.state.username = this.session.user.email;
    yield next;
}

function* dashboardHandler() {
    const users = yield this.db('users').select('*');
    const statuses = yield this.db('status').select('*');
    const priors = yield this.db('priority').select('*');
    this.body = yield this.render('dashboard', {
        users: users,
        statuses: statuses,
        priors: priors
    });
}

const userApi = require('./routes/userRouter');
app.use(mount('/api/user', userApi.routes));
app.use(mount('/api/task', require('./routes/taskRouter')));

const router = new Router();

router.get('/dashboard/:owner?/:id?', checkAuth, dashboardHandler);
router.get('/created', checkAuth, dashboardHandler);
router.get('/participants', checkAuth, dashboardHandler);
router.get('/task/:id', checkAuth, dashboardHandler);
router.get('/verify/:id/:verification', userApi.verifyEmail);

app.use(router.routes());


app.listen(port, function () {
    console.log("Server has started on " + port);
});
