(function() {
  var app, express, io;
  express = require('express');
  io = require('socket.io');
  app = module.exports = express.createServer();
  app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyDecoder());
    app.use(express.methodOverride());
    app.use(app.router);
    return app.use(express.staticProvider(__dirname + '/static'));
  });
  app.configure('development', function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  app.configure('production', function() {
    return app.use(express.errorHandler());
  });
  app.get('/', function(req, res) {
    return res.render('layout', {
      locals: {
        title: 'Express'
      }
    });
  });
  if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
  }
}).call(this);
