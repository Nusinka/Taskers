var App = require('./router');

var app = new App();
global.setAppData = function (name, data) {
    app.setData(name, data);
};

$(function () {
    app.start();
});
