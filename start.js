require('./utils/scheduler')
const server = require('./server/startServer')
const database = require('./dbOperations/connection')
const redisServer = require('./redis/redis')

database.connect(() => {
    redisServer.connect(() => {
        server.start(() => {
            console.log('Server is ready for client requests !!!')
        })
    })
})