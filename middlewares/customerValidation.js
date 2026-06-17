const Joi = require("joi");

const nameRule = (fieldName) =>
  Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/)
    .messages({
      "any.required": `${fieldName} is required`,
      "string.empty": `${fieldName} cannot be empty`,
      "string.min": `${fieldName} must be at least 3 characters`,
      "string.max": `${fieldName} cannot be more than 50 characters`,
      "string.pattern.base": `${fieldName} can only contain letters, spaces, apostrophes, or hyphens`,
    });

const passwordRule = Joi.string()
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])\S{8,20}$/)
  .required()
  .messages({
    "any.required": "Password is required",
    "string.empty": "Password cannot be empty",
    "string.pattern.base":
      "Password must be 8-20 characters and contain uppercase, lowercase, number, and special character",
  });

const emailRule = Joi.string().email().required().messages({
  "any.required": "Email is required",
  "string.empty": "Email cannot be empty",
  "string.email": "Invalid Email format",
});

const otpRule = Joi.string().length(6).pattern(/^\d+$/).required().messages({
  "any.required": "OTP is required",
  "string.empty": "OTP cannot be empty",
  "string.length": "OTP must be 6 digits",
  "string.pattern.base": "OTP must contain only numbers",
});

const validateBody = (schema, req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};

exports.customerValidator = (req, res, next) => {
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
  validateBody(schema, req, res, next);
};

exports.loginValidator = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
      "string.email": "Invalid Email format",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
      "string.empty": "Password cannot be empty",
    }),
  });
  validateBody(schema, req, res, next);
};

exports.forgetPasswordValidator = async (req, res, next) => {
  const schema = Joi.object({
    email: emailRule,
  })
  validateBody(schema, req, res, next);
}

exports.resetPaswordValidator = async (req, res, next) => {
  const schema = Joi.object({
    password: Joi.string().required().messages({
      "any.required": "Password is required",
      "string.empty": "Password cannot be empty",
    })
  })
  validateBody(schema, req, res, next);
}

exports.verifyEmailValidator = (req, res, next) => {
  const schema = Joi.object({
    email: emailRule,
    otp: otpRule,
  });
  validateBody(schema, req, res, next);
};

exports.resendOtpValidator = (req, res, next) => {
  const schema = Joi.object({
    email: emailRule,
  });
  validateBody(schema, req, res, next);
};

exports.updateCustomerProfileValidator = async (req, res, next) => {
  if (req.file && Object.keys(req.body || {}).length === 0) {
    return next();
  }

  const phoneRule = Joi.string().trim().min(7).max(20);
  const schema = Joi.object({
    firstName: nameRule("First name").optional(),
    lastName: nameRule("Last name").optional(),
    email: Joi.string().email().optional().messages({
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
      "string.email": "Invalid Email format",
    }),
    phone: phoneRule.optional().messages({
      "string.empty": "Phone cannot be empty",
      "string.min": "Phone number must be at least 7 characters",
      "string.max": "Phone number cannot be more than 20 characters",
    }),
    address: Joi.string().trim().min(1).max(255).optional().messages({
      "string.empty": "Address cannot be empty",
      "string.max": "Address cannot be more than 255 characters",
    }),
  }).or("firstName", "lastName", "email", "phone", "address");
  validateBody(schema, req, res, next);
}

exports.updatePasswordValidator = async (req, res, next) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required().messages({
      "any.required": "Current password is required",
      "string.empty": "Current password cannot be empty",
    }),
    newPassword: passwordRule.messages({
      "any.required": "New password is required",
      "string.empty": "New password cannot be empty",
      "string.pattern.base":
        "New password must be 8-20 characters and contain uppercase, lowercase, number, and special character",
    }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({
        "any.only": "Confirm password must match new password",
        "any.required": "Confirm password is required",
        "string.empty": "Confirm password cannot be empty",
      }),
  });
  validateBody(schema, req, res, next);
};
