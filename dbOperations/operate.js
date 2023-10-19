const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')

const eventEmitter = require('../utils/emitter')
const DB = require('./connection')
const constants = require('../constants');

eventEmitter.on('doScheduledTasks', () => {
    console.log("Running every minute job in operation.js")
    const query = `SELECT * FROM logout_user_tokens;`
    let deleteTokens = []

    DB.query(query, null, (err, response) => {
        if (err) {
            console.log(err)
            return
        }

        for (let eachToken of response) {
            try {
                jwt.verify(eachToken.token, constants._PRIVATE_KEY)
            } catch (error) {
                if (error.message == 'jwt expired') {
                    deleteTokens.push(eachToken.token)
                }
            }
        }

        if (deleteTokens.length > 0) {
            console.log("Tokens to be removed are ", deleteTokens)
            removeToken(deleteTokens, (err) => {
                if (err) {
                    console.log("Failed to delete tokens.")
                    return
                }

                console.log("All expired token are removed from database successfully.")
            })
        } else {
            console.log("No time expired tokens are there in the database.")
        }
    })
})

const searchUser = (username, callback) => {
    try {
        const query = `SELECT * FROM users WHERE name='${username}';`
        DB.query(query, null, function (err, res) {
            if (err) {
                callback(err)
                return
            }

            console.log('Searched user is ', res)
            callback(null, res)
        })
    } catch (error) {
        console.log(error)
    }
}

const addUser = async (user, callback) => {
    try {
        const query = 'INSERT INTO users (name, password, city) VALUES ?'

        if (user.password) {
            const hashedpswd = await bcrypt.hash(user.password, 10)
            user.password = hashedpswd
        }

        const values = [
            user.name ? user.name : null,
            user.password ? user.password : null,
            user.city ? user.city : null
        ]

        if (values.includes(null)) {
            callback({
                error: 'Please provide all necessary fields in the request.'
            })
            return
        }

        if (!user.role || user.role == '' || !Object.keys(constants._ALLOWED_ROLES).includes(user.role.trim().toLowerCase())) {
            callback({
                error: "Please provide valid user role."
            })
            return
        }

        searchUser(user.name, (err, res) => {
            if (err) {
                callback({
                    error: 'Failed to sign up user!!!'
                })
                return
            }

            console.log('Found users are ', res)
            if (res.length > 0) {
                callback({
                    error: 'User already exists.!!!'
                })
            } else {
                DB.query(query, values, (err, insert_user_res) => {
                    console.log('Done query')
                    if (err) {
                        console.log('Failed to insert user')
                        callback({ error: 'Failed to sign up user!!!' })
                        return
                    }

                    let q1 = `SELECT * FROM roles WHERE roleId = ${constants._ALLOWED_ROLES[user.role.trim().toLowerCase()]}`
                    console.log('Firing query ', q1)
                    DB.query(q1, null, (err, role_res) => {
                        if (err) {
                            console.log(err)
                            callback({ error: "Something went wrong." })
                            return
                        }

                        if (role_res && role_res.length > 0) {
                            let roleData = role_res[0];
                            const q2 = `INSERT INTO user_role_mapping (userid, roleid) VALUES (${insert_user_res.insertId}, ${roleData.id})`
                            console.log('Firing query ', q2)
                            DB.query(q2, null, (err, insertRoleUserMapRes) => {
                                if (err) {
                                    console.log(err)
                                    callback({ error: "Something went wrong." })
                                    return
                                }

                                console.log("Mappping entry inserted successfully.", insertRoleUserMapRes)
                                callback(null, user)
                            })
                        }
                    })
                })
            }
        })
    } catch (error) {
        console.log(error)
        callback({
            error: 'Failed to sign up user!!!'
        })
    }
}

const loginUser = (user, callback) => {
    try {
        searchUser(user.name, async (err, res) => {
            if (err) {
                callback({
                    error: 'Failed to login user!!!'
                })
                return
            }

            if (res && res.length > 0) {

                const user_DB = res[0]

                let result = await bcrypt.compare(user.password, user_DB.password)

                if (!result) {
                    callback({
                        error: 'Please login using valid credentials!!!'
                    }, null)
                    return
                }

                // Token will expire after 15 minutes
                const token = jwt.sign({ username: user_DB.name }, constants._PRIVATE_KEY, { expiresIn: '15m' });
                user_DB['token'] = token
                callback(null, user_DB)
            } else {
                callback({
                    error: 'User not exists.'
                }, null)
            }
        })
    } catch (error) {
        console.log(error)
        callback({
            error: 'Failed to login user.'
        }, null)
    }
}


const updateUser = (username, updateData, done) => {
    try {
        const query = `UPDATE users SET city = '${updateData.city}' WHERE name = '${username}';`
        console.log("Firing query ", query)
        DB.query(query, null, (err, response) => {
            if (err) {
                console.log(err)
                done({
                    error: "Failed to update user profile."
                })
                return
            }

            done(null)
        })
    } catch (error) {
        console.log(error)
        callback({
            error: 'Failed to update user.'
        }, null)
    }
}

const addInvalidTokenToDB = (token, done) => {
    try {
        const query = `INSERT INTO logout_user_tokens (token) VALUES ('${token}')`
        DB.query(query, null, (err, res) => {
            if (err) {
                done({ error: 'Failed to logout user' })
                return
            }

            done(null)
        })
    } catch (error) {
        console.log(error)
    }
}

const showAdminUsersOnly = (callback) => {
    try {
        const query = `SELECT name, city FROM users WHERE id IN (SELECT userid FROM user_role_mapping WHERE roleid = (SELECT id FROM roles WHERE roleId = 101))`
        DB.query(query, null, (err, response) => {
            if (err) {
                callback({ error: "Failed to fetch all admin users."})
                return
            }

            callback(null, response)
        })
    } catch (error) {
        console.log(error)
        callback([])
    }
}

const isTokenInvalid = (userToken, done) => {
    try {
        const query = `SELECT * FROM logout_user_tokens WHERE token = '${userToken}'`

        DB.query(query, null, (err, res) => {
            if (err) {
                done({
                    error: "Failed to find token in database."
                })
                return
            }

            done(null, res)
        })
    } catch (error) {
        console.log(error)
    }
}

const removeToken = (tokens, done) => {
    try {
        const query = `DELETE FROM logout_user_tokens WHERE token IN ?;`
        DB.query(query, tokens, (err, res) => {
            if (err) {
                console.log(err)
                return
            }
            console.log("Removed already expired token from list of inavlid tokens.")
            done && done()
        })
    } catch (error) {
        console.log(error)
    }
}

// const deletUser = (user, callback) => {
//     try {
//         const query = `DELETE FROM users WHERE name='${user.name}';`
//         DB.query(query, null, (res) => {
//             console.log('Result is ', res)
//             callback && callback(res)
//         })
//     } catch (error) {
//         console.log(error)
//     }
// }

// connection.connect(() => {
//     // deletUser({
//     //     name: "Niranjan"
//     // })

//     // searchUser({
//     //     name: "Niranjan"
//     // })

//     addUser({
//         name: '',
//         password: '',
//         city: ''
//     })

//     // addUser({
//     //     name: "Aditya",
//     //     password: 'aditya@123',
//     //     city: 'dhad'
//     // })

//     // addUser({
//     //     name: "Niranjan",
//     //     password: 'niranjan@123',
//     //     city: 'talode'
//     // })
// })

module.exports = {
    addUser: addUser,
    loginUser: loginUser,
    invalidateToken: addInvalidTokenToDB,
    removeTokenFromInvalid: removeToken,
    getUserInfo: searchUser,
    isTokenInvalid: isTokenInvalid,
    updateUser: updateUser,
    getAdminUsers: showAdminUsersOnly
}