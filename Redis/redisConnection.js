const { createClient } = require('redis')

console.log(process.env.REDIS_USERNAME)
console.log(process.env.REDIS_PASSWORD)
console.log(process.env.REDIS_HOST)
console.log(process.env.REDIS_PORT)
const redisClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD, 
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
})

redisClient.on('error', (err) => console.log('Redis Client Error', err))    
 module.exports = redisClient