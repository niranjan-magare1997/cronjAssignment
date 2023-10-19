const mysql = require('mysql');
const async = require('async')

const constants = require('../constants')

const dbName = constants._DB_NAME
let con, operateOnDB, values = {
    roles: 'roleId, description'
};

const makeDefaultEntries = (done) => {
    try {
        async.each(Object.keys(constants._DEFAULT_ENTRIES), (eachkey, doneTable) => {
            async.each(constants._DEFAULT_ENTRIES[eachkey], (eachEntry, doneInsertion) => {
                let query = `INSERT INTO ${eachkey} (${values[eachkey]}) VALUES (${eachEntry});`;
                console.log('QUERY => ', query)

                if (eachkey == 'roles') {
                    let q = `SELECT * FROM ${eachkey} WHERE roleId = ${eachEntry.split(',')[0]}`
                    console.log('QUERY => ', q)
                    queryOnDB(q, null, (err, res) => {
                        if (err) {
                            console.log('Error checking role entry')
                            console.log(err)
                        }

                        if (res && res.length == 0) {
                            console.log("Not found entry in database.")
                            queryOnDB(query, null, (err) => {
                                if (err) {
                                    console.log(`Failed to make entry ${eachEntry}`)
                                    console.log(err)
                                }
            
                                doneInsertion(null)
                            })
                        } else {
                            doneInsertion(null)
                        }
                    })
                } else {
                    queryOnDB(query, null, (err) => {
                        if (err) {
                            console.log(`Failed to make entry ${eachEntry}`)
                            console.log(err)
                        }
    
                        doneInsertion(null)
                    })
                }
            }, (err) => {
                doneTable()
            })
        }, (err) => {
            console.log('Done adding default entries.')
            done()
        })
    } catch (error) {
        console.log(error)
    }
}

const createTables = async (doneTabelCreation) => {
    try {
        for (let eachCreateTableIndex in constants._TABLES) {
            await new Promise((accept, reject) => {
                operateOnDB.query(constants._TABLES[eachCreateTableIndex], function (err, result) {
                    if (err) reject(err)
                    if ((constants._TABLES.length - 1) == eachCreateTableIndex) doneTabelCreation()
                    accept()
                })
            })
        }

        // async.each(constants._TABLES, (eachCreateTableQuery, done) => {
        //     operateOnDB.query(eachCreateTableQuery, function (err, result) {
        //         if (err) throw err
        //         done(null)
        //     })
        // }, (err) => {
        //     if (err) throw err

        //     console.log("All necessary tables are created successfully...")
        //     doneTabelCreation()
        // })        
    } catch (error) {
        console.log(error)
    }
}

const connectToDatabase = (cb) => {
    try {
        operateOnDB = mysql.createConnection({
            "host": constants._HOST,
            "user": constants._USERNAME,
            "password": constants._PSWD,
            "database": constants._DB_NAME
        });
        operateOnDB.connect(function (err) {
            if (err) throw err;
            console.log(`Connected to database ${constants._DB_NAME} !`);
            createTables(() => {
                makeDefaultEntries(cb)
                // cb()
            })
        });
    } catch (error) {
        console.log(error)
    }
}

const connect = (cb) => {
    try {
        con = mysql.createConnection({
            "host": constants._HOST,
            "user": constants._USERNAME,
            "password": constants._PSWD
        });

        con.connect(function (err) {
            if (err) throw err;
            console.log("Connected to mysql!");

            con.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, function (err, result) {
                if (err) throw err;
                console.log("Database created " + dbName);
                con.end()
                connectToDatabase(cb)
            });
        });
    } catch (error) {
        console.log(error)
    }
}

const exit = () => operateOnDB.end()

const queryOnDB = (query, params, doneCB) => {
    try {
        if (params && params.length > 0) {
            operateOnDB.query(query, [[params]], function (err, result) {
                if (err) {
                    doneCB(err, null)
                    return
                }
                console.log("\nQuery fired successfully...");
                console.log('Query is ', query)
                console.log('Result is ', (result))
                doneCB(null, result)
            });
        } else {
            operateOnDB.query(query, function (err, result) {
                if (err) {
                    doneCB(err, null)
                    return
                }
                console.log("\nQuery fired successfully...");
                console.log('Query is ', query)
                console.log('Result is ', (result))
                doneCB(null, result)
            });
        }
    } catch (error) {
        console.log(error)
    }
}

// connect(() => {
//     queryOnDB(`DELETE FROM logout_user_tokens WHERE token IN ?;`, ['token1', 'token2', 'token3'], () => {

//     })
// })


module.exports = {
    connect,
    query: queryOnDB,
    exit
}