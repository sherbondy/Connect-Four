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

pick_client = (client, message, p1, p2) ->
    if client.sessionId is p1
        io.clients[p2].send message
    else if client.sessionId is p2
        io.clients[p1].send message


validate_clients = (p1, p2, func...) ->
    if io.clients[p2] and not io.clients[p1]
        console.log 'P1 disconnected'
        io.clients[p2].send {action:'quit'}
    else if io.clients[p1] and not io.clients[p2]
        console.log 'P2 disconnected'
        io.clients[p1].send {action:'quit'}
    else if io.clients[p1] and io.clients[p2]
        func

io = io.listen app

pair_up = ->
    red.scard 'waiting', (err, res)->
        if res >= 2
            red.multi().spop('waiting').spop('waiting').exec (err, replies)->
                console.log replies
                # players 1 and 2
                [p1, p2] = replies
                validate_clients p1, p2, red.incr 'next.game.id', (err, num)->
                    s_name = 'game:'+num+':'
                    red.mset s_name+'p1', p1, s_name+'p2', p2,
                      'client:'+p1+':game', num, 'client:'+p2+':game', num, (err, res)->
                        io.clients[p1].send {game:num, player:1}
                        io.clients[p2].send {game:num, player:2}

io.on 'connection', (client)->

    client.on 'message', (message)->
        console.log message
        if message is 'play'
            red.sadd 'waiting', client.sessionId
        else if message.game
            console.log 'game!'
            s_name = 'game:'+message.game+':'
            red.mget s_name+'p1', s_name+'p2', (err, replies)->
                console.log replies
                [p1, p2] = replies
                validate_clients p1, p2, pick_client client, message, p1, p2


    client.on 'disconnect', ->
        red.srem 'waiting', client.sessionId
        console.log client.sessionId
        red.get 'client:'+client.sessionId+':game', (err, res)->
            console.log res
            if res
                console.log 'disconnecter game found'
                red.mget 'game:'+res+':p1', 'game:'+res+':p2', (err, res)->
                    console.log res
                    [p1, p2] = res
                    validate_clients p1, p2

setInterval pair_up, 1000
