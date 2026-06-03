const joi = require('joi')

exports.DesignerValidator = async (req, res, next) => {
    const schema = joi.object({
     firstName: Joi.string().pattern(/^[a-zA-Z]{3,}$/).required().messages({
                'any.required': "first Name is required",
                'string.empty': "first Name cannot be empty",
                'string.pattern.base': "first Name cannot contain digits or whitespace and must be minimum of 3 characters"
            }),
            lastName: Joi.string().pattern(/^[a-zA-Z]{3,}$/).required().messages({
                'any.required': "last Name is required",
                'string.empty': "last Name cannot be empty",
                'string.pattern.base': "last Name cannot contain digits or whitespace and must be minimum of 3 characters"
            }),
            email: Joi.string().email().required().messages({
                        'any.required': "Email is required",
                        'string.empty': "Email cannot be empty",
                        'string.email': "Invalid Email format"
            }),
            password: Joi.string().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])\S{8,20}$/).required().messages({
                        'any.required': "Password is required",
                        'string.empty': "Password cannot be empty",
                        "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
            }),
})
const { error } = schema.validate(req.body);
    if (error) {
        res.status(400).json({
            message: error.details[0].message
        })
    }

    next();
}
