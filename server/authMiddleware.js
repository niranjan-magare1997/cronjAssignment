const jwt = require('jsonwebtoken')
const database = require('../dbOperations/operate')
const constants = require('../constants')

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        console.log('Token => ', token)
        let verifiedObject = jwt.verify(token, constants._PRIVATE_KEY)
        console.log(verifiedObject)
        req.body['username'] = verifiedObject.username;
        next()
    } catch (error) {
        if (error.message == 'jwt expired') {
            const token = req.header('Authorization').replace('Bearer ', '')
            database.removeTokenFromInvalid([token])
        }
        res.status(401).send({ error: "Please authenticate with valid token." })
    }
}

module.exports = auth