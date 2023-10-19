// const jwt = require('jsonwebtoken')

// const token = jwt.sign({
//     name: 'Niranjan'
// }, 'niru', {
//     expiresIn: '1s'
// })

// setTimeout(() => {
//     try {
//         console.log(jwt.verify(token, 'niru'))
//     } catch (error) {
//         console.log(error.message)
//     }
// }, 2000);

// const newtoken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiTmlyYW5qYW4iLCJpYXQiOjE2OTc0ODYwMjIsImV4cCI6MTY5NzQ4NjAzMn0.yyM1CdGhYy7Ide3rp-tGDZUtOU5bnq6Ac86rmy2Lrms'
// console.log(jwt.verify(newtoken, 'niru'))



// const bcrypt = require('bcrypt')

// async function hashPswd (pswd) {
//     let pswd2 = await bcrypt.hash(pswd, 10);
//     console.log(pswd2)

//     let result = await bcrypt.compare('niranjan@123', pswd2)
//     console.log('Result after comparing ', result)
// }

// hashPswd('Niranjan@123')

async function f1 () {
    const createClient = require('redis').createClient
    const client = createClient();
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
}

f1()