 # Module dependencies.

express = require 'express'
io = require 'socket.io'

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
