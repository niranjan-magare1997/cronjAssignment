const express = require("express")
const jwt = require('jsonwebtoken')

const constants = require('../constants')
const database = require('../dbOperations/operate')
const weather = require('../weather/weather')

const auth = require('./authMiddleware')
const redisDB = require('../redis/redis')
const rateLimitter = redisDB.rateLimiter

const app = express()

app.use(express.json())

app.post('/signup', (req, res) => {
    try {
        console.log(req.body)
        database.addUser(req.body, (err, user) => {
            if (err) {
                res.status(400).send(err)
                return
            }

            res.send(user)
        })
    } catch (error) {
        res.status(500).send()
    }
})

app.get('/login', (req, res) => {
    try {
        console.log('In login request')
        database.loginUser(req.body, (err, response) => {
            if (err) {
                console.log(err)
                res.status(400).send(err)
                return
            }
            console.log("Sapadla vatt...")
            res.send(response)
        })
    } catch (error) {
        res.status(500).send()
    }
})

app.get('/logout', (req, res) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')

        console.log('In login request', req.header)

        try {

            database.isTokenInvalid(token, (err, db_res) => {
                if (err) {
                    res.status(500).send({
                        error: "Failed to logout user."
                    })
                    return
                }

                if (db_res && db_res.length > 0) {
                    res.status(401).send({
                        error: "You are already logged out."
                    })
                    return
                }

                jwt.verify(token, constants._PRIVATE_KEY)
    
                database.invalidateToken(token, (err) => {
                    if (err) {
                        res.status(500).send(err)
                    }
                    res.send({
                        msg: 'Logout successfull'
                    })
                })
            })
        } catch (e) {
            console.log('Unable to add token into inavlid token list.')
            res.status(500).send({
                error: 'Failed to logout user.'
            })
        }
    } catch (error) {
        res.status(500).send()
    }
})

app.get('/profile', auth, (req, res) => {
    try {
        console.log(req.body)
        database.getUserInfo(req.body.username, (err, userData) => {
            if (err) {
                res.status(500).send({
                    error: "Unable to find user profile."
                })
                return
            }
            delete userData[0]['password']
            res.send(userData[0])
        })
    } catch (error) {
        console.log(error)
        res.status(500).send()
    }
})

app.get('/showAdminsOnly', auth, (req, res) => {
    try {
        database.getAdminUsers((err, responseData) => {
            if (err) {
                res.status(500).send(err)
                return
            }

            res.send(responseData)
        })
    } catch (error) {
        console.log(error)
        res.status(500).send()
    }
})

app.put('/profile', auth, (req, res) => {
    try {
        console.log(req.body)
        let updateData = JSON.parse(JSON.stringify(req.body))
        delete updateData.username
        database.updateUser(req.body.username, updateData, (err) => {
            if (err) {
                res.status(500).send({
                    error: "Failed to update profile."
                })
                return
            }

            res.send({
                msg: "User profile updated successfully!!!"
            })
        })
    } catch (error) {
        console.log(error)
        res.status(500).send()
    }
})

app.get('/weather', auth, rateLimitter, redisDB.weatherMiddleware, (req, res) => {
    try {
        const location = req.body.location;
        if (location && location!= "") {
            weather.getWeatherForecast(location, async (err, forecastData) => {
                if (err) {
                    res.status(500).send(err)
                    return
                }
    
                await redisDB.writeData(location, JSON.stringify(forecastData))
                res.send(forecastData)
            })
        } else {
            res.status(400).send({
                error: "Please provide valid location as input!!!"
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).send()
    }
})

const _404Response = (req, res) => {
    res.status(404).send({
        error: "404 Not found."
    })
}

const methodNotAllowed = (req, res) => {
    res.status(405).send({
        error: "Operation not allowed."
    })
}

app.all('/signup', methodNotAllowed)
app.all('/login', methodNotAllowed)
app.all('/logout', methodNotAllowed)
app.all('/profile', methodNotAllowed)
app.all('/weather', methodNotAllowed)
app.all('/showAdminsOnly', methodNotAllowed)
app.all('*', _404Response)

module.exports = {
    start: (callback) => {
        app.listen(constants._PORT, () => {
            console.log('HTTP Server running on port ', constants._PORT)
            callback()
        })
    }
}
