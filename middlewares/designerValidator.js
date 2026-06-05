const Joi = require("joi");

const nameRule = (fieldName) =>
  Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/)
    .messages({
      "any.required": `${fieldName} is required`,
      "string.empty": `${fieldName} cannot be empty`,
      "string.min": `${fieldName} must be at least 2 characters`,
      "string.max": `${fieldName} cannot be more than 50 characters`,
      "string.pattern.base": `${fieldName} can only contain letters, spaces, apostrophes, or hyphens`,
    });

const passwordRule = Joi.string()
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])\S{8,20}$/)
  .required()
  .messages({
    "any.required": "Password is required",
    "string.empty": "Password cannot be empty",
    "string.pattern.base":
      "Password must be 8-20 characters and contain uppercase, lowercase, number, and special character",
  });

exports.designerValidator = (req, res, next) => {
  const schema = Joi.object({
    firstName: nameRule("First name").required(),
    lastName: nameRule("Last name").required(),
    email: Joi.string().email().required().messages({
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
      "string.email": "Invalid Email format",
    }),
    password: passwordRule,
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  next();
};
