(function() {
  var app, express, io, pair_up, red, redis, static;
  express = require('express');
  io = require('socket.io');
  redis = require('redis');
  static = __dirname + '/static';
  app = express.createServer(express.compiler({
    src: static,
    enable: ['less']
  }));
  app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.static(static));
    app.use(express.bodyParser());
    return app.use(express.methodOverride());
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
    return res.render('index', {
      locals: {
        hello: 'test'
      }
    });
  });
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
  red = redis.createClient();
  red.on('error', function(err) {
    return console.log('Error ' + err);
  });
  io = io.listen(app);
  pair_up = function() {
    var c1, c2;
    if (red.llen('waiting' >= 2)) {
      c1 = red.lpop('waiting', red.print);
      c2 = red.lpop('waiting', red.print);
      io.clients[c1].send(c2);
      return io.clients[c2].send(c1);
    }
  };
  io.on('connection', function(client) {
    red.rpush('waiting', client.sessionId, function(err, res) {
      console.log(err);
      return console.log(res);
    });
    client.broadcast({
      announcement: client.sessionId + ' connected'
    });
    client.on('message', function(message) {
      return client.send({
        test: 'hello there'
      });
    });
    return client.on('disconnect', function() {
      return red.lrem('waiting', -1, client.sessionId, function(err, res) {
        console.log(err);
        return console.log(res);
      });
    });
  });
  setInterval(pair_up, 1000);
}).call(this);
