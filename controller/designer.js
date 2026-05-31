const { Designer }  = require('../models');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');

exports.createDesingner  = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body

        const existingEmail = await Designer.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(404).json({
                message: 'Designer with this email already exists'
            })
        }

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        })

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newDesiner = await Designer.create({
            firstName,
            lastName,
            email,
            password: hashPassword,
            otp
        })

        isEmailVerified = false

        res.status(200).json({
            message: 'Designer created successfully',
            data: newDesiner
        })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            message: 'Something went wrong'
        })
    }
}