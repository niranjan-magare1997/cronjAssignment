const redis = require('redis')
const client = redis.createClient({})
const requestsPerMinute = 5

const connect = async (callback) => {
    try {
        if (!client.isOpen) {
            // console.log('client.isOpen 1 => ',client.isOpen)
            // console.log("Here ")
            await client.connect();
            // console.log('client.isOpen 2 => ',client.isOpen)
            client.on('error', (err) => {
                console.log("Error in redis client.")
                console.log(err)
            })

            client.on('close', (reason) => {
                console.log('Client closed ', reason)
            })
            callback()
        } else {
            callback()
        }
    } catch (error) {
        console.log(error)
    }
}

// For now 5 requests per minute are allowed from one ip
// Time in seconds
const rateLimiter = async (req, res, next) => {
    try {
        const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',')[0]

        let ttl
        const requests = await client.incr(ip)
        if (requests === 1) {
            await client.expire(ip, 60)
            ttl = 60
        } else {
            ttl = await client.ttl(ip)
        }
        if (requests > requestsPerMinute) {
            return res.status(429).send({
                error: `Too many requests. Try again after ${ttl} seconds`
            });
        }
        next();
    } catch (err) {
        return res.status(500).send({
            error: 'An error occurred while processing the request!'
        });
    }
}

const writeData = async (key, data) => {
    try {
        return new Promise(async (accept) => {
            if (client.isOpen) {
                let responseData = await client.set(key, data)
                accept(responseData)
            } else {
                console.log("Redis client is not connected.")
                accept(null)
            }
        })
    } catch (error) {
        console.log(error)
    }
}

const readData = async (key) => {
    try {
        return new Promise(async (accept) => {
            if (client.isOpen) {
                let cachedData = await client.get(key)
                accept(cachedData)
            } else {
                console.log("Redis client is not connected.")
                accept(null)
            }
        })
    } catch (error) {
        console.log(error)
    }
}

const weatherMiddleware = async (req, res, next) => {
    try {
        let location = req.body.location;
        let foundData = await readData(location)

        if (foundData) {
            // console.log('Found data in cache.')
            foundData = JSON.parse(foundData)
            foundData['cached'] = true
            res.send(foundData)
        } else {
            next()
        }
    } catch (error) {
        console.log(error)
    }
}

// connect(async () => {
//     let writeResponse = await writeData('name', 'Niranjan Magare')
//     let readResponse = await readData('name')

//     console.log(writeResponse)
//     console.log(readResponse)
// })

module.exports = {
    connect,
    rateLimiter,
    writeData,
    readData,
    weatherMiddleware
}