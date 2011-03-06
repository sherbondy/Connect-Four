 # Module dependencies.

express = require 'express'
io = require 'socket.io'
redis = require 'redis'

static = __dirname + '/static'

app = express.createServer(
  express.compiler src:static, enable: ['less']
)

# Configuration

app.configure ->
  app.set 'views', __dirname + '/views'
  app.set 'view engine', 'jade'
  app.use express.static(static)
  app.use express.bodyParser()
  app.use express.methodOverride()

app.configure 'development', ->
  app.use express.errorHandler {dumpExceptions: true, showStack: true}

app.configure 'production', ->
  app.use express.errorHandler()

# Routes

app.get '/', (req, res)->
  res.render 'index', {
    locals: {hello: 'test'}
  }

app.listen(3000)
console.log "Express server listening on port %d", app.address().port


# redis client

red = redis.createClient()
red.on 'error', (err)->
  console.log 'Error '+err

# socket.io server

io = io.listen app

pair_up = ->
  if red.llen 'waiting' >= 2
    c1 = red.lpop('waiting', red.print)
    c2 = red.lpop('waiting', red.print)
    io.clients[c1].send c2
    io.clients[c2].send c1

io.on 'connection', (client)->
  red.rpush('waiting', client.sessionId,  (err, res)->
    console.log err
    console.log res
  )

  client.broadcast {announcement: client.sessionId + ' connected'}

  client.on 'message', (message)->
    client.send {test:'hello there'}
  client.on 'disconnect', ->
    red.lrem('waiting', -1, client.sessionId, (err, res)->
      console.log err
      console.log res
    )

setInterval pair_up, 1000
