 # Module dependencies.

express = require 'express'
io = require 'socket.io'

app = module.exports = express.createServer()

# Configuration

app.configure ->
  app.set 'views', __dirname + '/views'
  app.set 'view engine', 'jade'
  app.use express.bodyDecoder()
  app.use express.methodOverride()
  app.use app.router
  app.use express.staticProvider __dirname + '/static'

app.configure 'development', ->
  app.use express.errorHandler {dumpExceptions: true, showStack: true}

app.configure 'production', ->
  app.use express.errorHandler()

# Routes

app.get '/', (req, res)->
  res.render 'layout',
    locals: {title: 'Express'}

# Only listen on $ node app.js

if not module.parent
  app.listen(3000)
  console.log "Express server listening on port %d", app.address().port
