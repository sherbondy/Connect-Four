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
    red.llen 'waiting', (err, res)->
        if res >= 2
            red.multi().lpop('waiting').lpop('waiting').exec (err, replies)->
                console.log replies
                # players 1 and 2
                p1 = replies[0]
                p2 = replies[1]

                red.incr 'next.game.id', (err, num)->
                    s_name = 'game:'+num+':'
                    red.mset s_name+'p1', p1, s_name+'p2', p2, (err, res)->
                        io.clients[p1].send {game:num, player:1}
                        io.clients[p2].send {game:num, player:2}


io.on 'connection', (client)->

    client.on 'message', (message)->
        console.log message
        if message is 'play'
            red.rpush 'waiting', client.sessionId, (err, res)->
                console.log err
                console.log res

    client.on 'disconnect', ->
        red.lrem 'waiting', -1, client.sessionId, (err, res)->
            console.log err
            console.log res

setInterval pair_up, 1000
