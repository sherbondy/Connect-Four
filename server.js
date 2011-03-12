var app, express, get_distance, io, pair_up, players, red, redis, secret, static, validate_clients;
var __slice = Array.prototype.slice;
express = require('express');
io = require('socket.io');
redis = require('redis');
secret = require('./secret.js');
Array.prototype.remove = function(e) {
  var t, _ref;
  if ((t = this.indexOf(e)) > -1) {
    return ([].splice.apply(this, [t, t - t + 1].concat(_ref = [])), _ref);
  }
};
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
red = redis.createClient(9402, 'filefish.redistogo.com');
red.auth(secret.password, function(status) {
  return console.log(status);
});
red.on('error', function(err) {
  return console.log('Error ' + err);
});
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
get_distance = function(pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.latitude - pos2.latitude, 2) + Math.pow(pos1.longitude - pos2.longitude, 2));
};
players = [];
io = io.listen(app);
pair_up = function(p1, p2) {
  return red.incr('next.game.id', function(err, num) {
    var s_name;
    s_name = 'game:' + num + ':';
    return red.mset(s_name + 'p1', p1, s_name + 'p2', p2, 'client:' + p1 + ':game', num, 'client:' + p2 + ':game', num, function(err, res) {
      var name1, name2;
      name1 = players[p1].name;
      name2 = players[p2].name;
      players[p1].opponent = name2;
      players[p2].opponent = name1;
      io.clients[p1].send({
        game: num,
        player: 1,
        opponent: name2
      });
      return io.clients[p2].send({
        game: num,
        player: 2,
        opponent: name1
      });
    });
  });
};
io.on('connection', function(client) {
  players[client.sessionId] = {
    opponent: null,
    name: null,
    location: null,
    time_stamp: null
  };
  client.on('message', function(message) {
    var p1, player, s_name;
    console.log(message);
    if (message && message.action === 'play') {
      p1 = client.sessionId;
      player = players[client.sessionId];
      player.name = message.name;
      player.location = message.location;
      player.time_stamp = Math.round(new Date().getTime() / 1000);
      console.log(player.time_stamp);
      return red.hget('waiting', player.time_stamp, function(err, res) {
        var p2;
        if (!res) {
          return red.hgetall('waiting', function(err, waiting) {
            var acceptable, found, loc, p2, ts, _i, _j, _len, _ref, _ref2, _results;
            acceptable = (function() {
              _results = [];
              for (var _i = _ref = player.time_stamp - 2, _ref2 = player.time_stamp + 2; _ref <= _ref2 ? _i <= _ref2 : _i >= _ref2; _ref <= _ref2 ? _i += 1 : _i -= 1){ _results.push(_i); }
              return _results;
            }).apply(this, arguments);
            found = false;
            for (_j = 0, _len = acceptable.length; _j < _len; _j++) {
              ts = acceptable[_j];
              p2 = waiting[ts];
              if (p2) {
                console.log(p2);
                loc = players[p2].location;
                if (loc && get_distance(loc, player.location) < 2) {
                  found = true;
                  pair_up(p1, p2);
                }
              }
            }
            if (!found) {
              return red.hsetnx('waiting', player.time_stamp, client.sessionId);
            }
          });
        } else {
          p2 = res;
          red.hdel('waiting', player.time_stamp);
          return pair_up(p1, p2);
        }
      });
    } else if (message.game) {
      console.log('game!');
      s_name = 'game:' + message.game + ':';
      return red.mget(s_name + 'p1', s_name + 'p2', function(err, replies) {
        var p2, pick_client;
        console.log(replies);
        p1 = replies[0], p2 = replies[1];
        pick_client = function(client, message, p1, p2) {
          if (client.sessionId === p1) {
            return io.clients[p2].send(message);
          } else if (client.sessionId === p2) {
            return io.clients[p1].send(message);
          }
        };
        return validate_clients(p1, p2, pick_client(client, message, p1, p2));
      });
    }
  });
  return client.on('disconnect', function() {
    console.log(client.sessionId);
    players.remove(players.indexOf(client.sessionId));
    red.hdel('waiting', players[client.sessionId].time_stamp);
    return red.get('client:' + client.sessionId + ':game', function(err, res) {
      console.log(res);
      if (res) {
        console.log('disconnecter game found');
        return red.mget('game:' + res + ':p1', 'game:' + res + ':p2', function(err, res) {
          var p1, p2;
          console.log(res);
          p1 = res[0], p2 = res[1];
          red.del('game:' + res + ':p1');
          red.del('game:' + res + ':p2');
          return validate_clients(p1, p2);
        });
      }
    });
  });
});