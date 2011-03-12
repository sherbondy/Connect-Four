 # Module dependencies.
require.paths.unshift(__dirname)

express = require 'express'
io = require 'socket.io'
redis = require 'redis'
# make sure you make a module called secret.js
# with the following contents: exports.password = 'your_redis_password'
secret = require './secret.js'

Array::remove = (e) ->
    @[t..t] = [] if (t = @.indexOf(e)) > -1

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

# duostack currently requires 9980 for websockets to work properly
app.listen(9980)
console.log "Express server listening on port %d", app.address().port


# redis client

red = redis.createClient(9402, 'filefish.redistogo.com')

red.auth secret.password, (status)->
    console.log status

red.on 'error', (err)->
    console.log 'Error '+err

# socket.io server

validate_clients = (p1, p2, func...) ->
    if io.clients[p2] and not io.clients[p1]
        console.log 'P1 disconnected'
        io.clients[p2].send {action:'quit'}
    else if io.clients[p1] and not io.clients[p2]
        console.log 'P2 disconnected'
        io.clients[p1].send {action:'quit'}
    else if io.clients[p1] and io.clients[p2]
        func

# get the pseudo-distance between two lat/long pairs
get_distance = (pos1, pos2) ->
    Math.sqrt(Math.pow((pos1.latitude-pos2.latitude), 2) +
              Math.pow((pos1.longitude-pos2.longitude), 2))

# a list of players
players = []
io = io.listen app

pair_up = (p1, p2)->
    red.incr 'next.game.id', (err, num)->
        s_name = 'game:'+num+':'
        red.mset s_name+'p1', p1, s_name+'p2', p2,
          'client:'+p1+':game', num, 'client:'+p2+':game', num, (err, res)->
            name1 = players[p1].name
            name2 = players[p2].name

            players[p1].opponent = name2
            players[p2].opponent = name1

            io.clients[p1].send {game:num, player:1, opponent:name2}
            io.clients[p2].send {game:num, player:2, opponent:name1}


io.on 'connection', (client)->
    players[client.sessionId] = {opponent:null, name:null, location:null, time_stamp:null}

    client.on 'message', (message)->
        console.log message
        if message and message.action is 'play'
            p1 = client.sessionId

            player = players[client.sessionId]
            player.name = message.name
            player.location = message.location
            player.time_stamp = Math.round(new Date().getTime() / 1000)

            console.log player.time_stamp

            red.hget 'waiting', player.time_stamp, (err, res)->
                if not res
                    red.hgetall 'waiting', (err, waiting)->
                        # a range of acceptable timestamps to search
                        acceptable = [(player.time_stamp-2)..(player.time_stamp + 2)]
                        # if we find a match, set this to true
                        found = false

                        for ts in acceptable
                            p2 = waiting[ts]

                            if p2
                                console.log p2
                                loc =  players[p2].location

                                if loc and get_distance(loc, player.location) < 2
                                    found = true
                                    pair_up(p1, p2)

                        # if we exit the loop without finding matches, add the player to redis
                        if not found
                            # don't want to overwrite a value if it was populated while we were checking
                            red.hsetnx 'waiting', player.time_stamp, client.sessionId
                else
                    p2 = res

                    # delete from waiting since we found a match
                    red.hdel 'waiting', player.time_stamp

                    pair_up(p1, p2)

        else if message.game
            console.log 'game!'
            s_name = 'game:'+message.game+':'
            red.mget s_name+'p1', s_name+'p2', (err, replies)->
                console.log replies
                [p1, p2] = replies

                pick_client = (client, message, p1, p2) ->
                    if client.sessionId is p1
                        io.clients[p2].send message
                    else if client.sessionId is p2
                        io.clients[p1].send message

                validate_clients p1, p2, pick_client client, message, p1, p2


    client.on 'disconnect', ->
        console.log client.sessionId
        players.remove players.indexOf client.sessionId

        red.hdel 'waiting', players[client.sessionId].time_stamp

        red.get 'client:'+client.sessionId+':game', (err, res)->
            console.log res
            if res
                console.log 'disconnecter game found'
                red.mget 'game:'+res+':p1', 'game:'+res+':p2', (err, res)->
                    console.log res
                    [p1, p2] = res

                    red.del 'game:'+res+':p1'
                    red.del 'game:'+res+':p2'

                    validate_clients p1, p2

# setInterval pair_up, 1000
