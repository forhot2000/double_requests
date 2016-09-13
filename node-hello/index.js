var koa = require('koa');
var app = module.exports = koa();
var logger = require('koa-logger');

app.use(logger());

app.use(function* () {
  yield new Promise((resolve, reject) => {
    setTimeout(() => {
      this.body = 'Hello asynchronous world!';
      resolve();
    }, 1000);
  });
});

if (!module.parent) app.listen(3000);
