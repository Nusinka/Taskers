'use strict';
const Router = require('koa-router');
const router = new Router();
const crypto = require('crypto');
const thunkify = require('thunkify');
const pbkdf2 = thunkify(crypto.pbkdf2);
const _ = require('lodash');
const mandrill = require('mandrill-api/mandrill');


router.post('/register', function* () {
    const data = this.request.body;
    const email = yield this.db.select('email')
        .table('users').where({email: data.email});

    this.assert(
        !email.length, 400, 'This email has already exist.');

    this.assert(data.password == data.confirmation,
        400, 'Password and confirmation does not match.');

    const user = {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName
    };

    const salt = crypto.randomBytes(16).toString('hex');

    const key = yield pbkdf2(user.password, salt, 10000, 64);

    _.extend(user, {
        password: key.toString('hex'),
        salt: salt,
        verification: crypto.randomBytes(16).toString('hex')
    });

    const result = yield this.db('users').insert(user);

    const mandrill_client = new mandrill.Mandrill('yrwfrosDVMpLZCjDXuoYSw');
    const message = {
        'html': '<p>For completion of registration please follow this <a href="http://localhost:8080/verify/' +
        result + '/' + user.verification + '">link</a></p>',
        'subject': 'Please, confirm registration!',
        'from_email': 'admin@supersite.com',
        'from_name': 'taskers.supersite.com',
        'to': [{
            'email': user.email,
            'name': user.first_name + user.last_name
        }]
    };
    mandrill_client.messages.send({"message": message, async: false}, function (result) {
        console.log('result: ', result);
    }, function (e) {
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    });
    this.body = 'ok';
});

router.post('/login', function* () {
    const user = yield this.db('users').select('*')
        .where({email: this.request.body.email});

    this.assert(user.length, 401, 'Wrong email or password');
    const salt = user[0].salt;
    const password = this.request.body.password;
    const key = yield pbkdf2(password, salt, 10000, 64);

    this.assert(user[0].password == key.toString('hex'), 401, 'Wrong email or password');
    this.session.user = {
        id: user[0].id,
        email: user[0].email
    };
    this.body = 'ok';
});

function* verifyEmail() {
    const id = this.params.id;
    const verification = this.params.verification;
    const verify = yield this.db.select('verification')
        .table('users').where({id: id});

    this.assert(verify[0].verification == verification,
        400, 'Bad request');

    const data = yield this.db('users').where({id: id})
        .update({approved: true});
    const user = yield this.db.select('email')
        .table('users').where({id: id});
    this.session.user = user;

    this.redirect('/dashboard');
}

router.get('/logout', function* () {
    this.session.user = null;
    this.body = 'ok';
});

module.exports = {
    routes: router.routes(),
    verifyEmail: verifyEmail
};
