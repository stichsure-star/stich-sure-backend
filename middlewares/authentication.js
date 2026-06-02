const jwt = require('jsonwebtoken');

exports.authentication = async(req, res, next) => {
    try {
        
        const token = req.headers.authorization.split(' ')[1]
        if(!token){
            return res.status(401).json({
                message: 'Token not found'
            })
        }
        const validToken = await jwt.verify(token, process.env.JWT_SECRET, (err,data) => {
            if(err) {
                console.log(err.message)
                return res.status(404).json({
                    message: 'Token validation failed'
            })
        }
        req.user = data
        next()
        })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            message: 'Something went wrong'
        })
    } 
}