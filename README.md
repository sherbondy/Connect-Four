#Connect Four

A node.js rendition of Bump's own BumpFour game for iOS.
It uses websockets with help from socket.io.
The whole app was written in CoffeeScript with the Express framework.
Redis is used as our datastore.

Try it out here: http://webbump4.duostack.net

Make sure to make a file called secret.js with the following contents:
    password='your_redis_password'

## Required Packages

- [Express 2.0+](https://github.com/visionmedia/express)
- [Socket.io](https://github.com/LearnBoost/Socket.IO-node)
- [Jade](https://github.com/visionmedia/jade)
- [node_redis](https://github.com/mranney/node_redis)
