var app, express, io, pair_up, pick_client, red, redis, static, validate_clients;
var __slice = Array.prototype.slice;
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
pick_client = function(client, message, p1, p2) {
  if (client.sessionId === p1) {
    return io.clients[p2].send(message);
  } else if (client.sessionId === p2) {
    return io.clients[p1].send(message);
  }
};
validate_clients = function() {
  var func, p1, p2;
  p1 = arguments[0], p2 = arguments[1], func = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
  if (io.clients[p2] && !io.clients[p1]) {
    console.log('P1 disconnected');
    return io.clients[p2].send({
      action: 'quit'
    });
  } else if (io.clients[p1] && !io.clients[p2]) {
    console.log('P2 disconnected');
    return io.clients[p1].send({
      action: 'quit'
    });
  } else if (io.clients[p1] && io.clients[p2]) {
    return func;
  }
};
io = io.listen(app);
pair_up = function() {
  return red.scard('waiting', function(err, res) {
    if (res >= 2) {
      return red.multi().spop('waiting').spop('waiting').exec(function(err, replies) {
        var p1, p2;
        console.log(replies);
        p1 = replies[0], p2 = replies[1];
        return validate_clients(p1, p2, red.incr('next.game.id', function(err, num) {
          var s_name;
          s_name = 'game:' + num + ':';
          return red.mset(s_name + 'p1', p1, s_name + 'p2', p2, 'client:' + p1 + ':game', num, 'client:' + p2 + ':game', num, function(err, res) {
            io.clients[p1].send({
              game: num,
              player: 1
            });
            return io.clients[p2].send({
              game: num,
              player: 2
            });
          });
        }));
      });
    }
  });
};
io.on('connection', function(client) {
  client.on('message', function(message) {
    var s_name;
    console.log(message);
    if (message === 'play') {
      return red.sadd('waiting', client.sessionId);
    } else if (message.game) {
      console.log('game!');
      s_name = 'game:' + message.game + ':';
      return red.mget(s_name + 'p1', s_name + 'p2', function(err, replies) {
        var p1, p2;
        console.log(replies);
        p1 = replies[0], p2 = replies[1];
        return validate_clients(p1, p2, pick_client(client, message, p1, p2));
      });
    }
  });
  return client.on('disconnect', function() {
    red.srem('waiting', client.sessionId);
    console.log(client.sessionId);
    return red.get('client:' + client.sessionId + ':game', function(err, res) {
      console.log(res);
      if (res) {
        console.log('disconnecter game found');
        return red.mget('game:' + res + ':p1', 'game:' + res + ':p2', function(err, res) {
          var p1, p2;
          console.log(res);
          p1 = res[0], p2 = res[1];
          return validate_clients(p1, p2);
        });
      }
    });
  });
});
setInterval(pair_up, 1000);