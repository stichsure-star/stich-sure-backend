const Joi = require("joi");

const uuidRule = Joi.string().guid({ version: ["uuidv4", "uuidv5"] });
const textRule = (label, max = 1000) =>
  Joi.string().trim().min(1).max(max).messages({
    "string.empty": `${label} cannot be empty`,
    "string.min": `${label} cannot be empty`,
    "string.max": `${label} cannot be more than ${max} characters`,
  });

const amountRule = Joi.number().positive().precision(2);
const phoneRule = Joi.string()
  .trim()
  .pattern(/^\+?\d{7,20}$/)
  .min(7)
  .max(20)
  .messages({
    "string.pattern.base": "Invalid phone number format. Only digits and an optional leading '+' are allowed.",
  });
const dateRule = Joi.date().iso();

const validateBody = (schema, options = {}) => (req, res, next) => {
  const hasUploadedFile = !!req.file;
  const hasBodyFields = Object.keys(req.body || {}).length > 0;

  if (options.allowFileOnly && hasUploadedFile && !hasBodyFields) {
    return next();
  }

  const { error, value } = schema.validate(req.body || {}, {
    abortEarly: true,
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  req.body = value;
  next();
};

const optionalString = (label, max = 1000) => textRule(label, max).optional();
const requiredString = (label, max = 1000) => textRule(label, max).required();

const walletSchema = Joi.object({
  bankName: requiredString("Bank name", 100),
  bankCode: optionalString("Bank code", 20),
  accountNumber: Joi.string().trim().pattern(/^\d{10}$/).required().messages({
    "any.required": "Account number is required",
    "string.empty": "Account number cannot be empty",
    "string.pattern.base": "Account number must be 10 digits",
  }),
  accountName: optionalString("Account name", 100),
});

const walletUpdateSchema = Joi.object({
  bankName: optionalString("Bank name", 100),
  bankCode: optionalString("Bank code", 20),
  accountNumber: Joi.string().trim().pattern(/^\d{10}$/).optional().messages({
    "string.empty": "Account number cannot be empty",
    "string.pattern.base": "Account number must be 10 digits",
  }),
  accountName: optionalString("Account name", 100),
}).or("bankName", "bankCode", "accountNumber", "accountName");

const resolveBankAccountSchema = Joi.object({
  bankName: optionalString("Bank name", 100),
  bankCode: optionalString("Bank code", 20),
  accountNumber: Joi.string().trim().pattern(/^\d{10}$/).required().messages({
    "any.required": "Account number is required",
    "string.empty": "Account number cannot be empty",
    "string.pattern.base": "Account number must be 10 digits",
  }),
}).or("bankName", "bankCode");

const profileFields = {
  businessName: optionalString("Business name", 100),
  currentHouseAddress: optionalString("Current house address", 255),
  phoneNumber: phoneRule.optional().messages({
    "string.empty": "Phone number cannot be empty",
    "string.min": "Phone number must be at least 7 characters",
    "string.max": "Phone number cannot be more than 20 characters",
  }),
  bankName: optionalString("Bank name", 100),
  accountNumber: Joi.string().trim().pattern(/^\d{10}$/).optional().messages({
    "string.pattern.base": "Account number must be 10 digits",
  }),
  accountName: optionalString("Account name", 100),
  specialization: Joi.alternatives()
    .try(Joi.array().items(textRule("Specialization", 80)).min(1), textRule("Specialization", 500))
    .optional(),
  yearsOfExperience: Joi.number().integer().min(0).max(80).optional(),
  shortBio: optionalString("Short bio", 1000),
  firstName: optionalString("First name", 100),
  lastName: optionalString("Last name", 100),
};

const addressSchema = Joi.object({
  name: requiredString("Name", 100),
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.email": "Invalid Email format",
  }),
  phone: phoneRule.required().messages({
    "any.required": "Phone is required",
    "string.empty": "Phone cannot be empty",
  }),
  address: requiredString("Address", 255),
});

const packageItemSchema = Joi.object({
  name: requiredString("Package item name", 100),
  description: requiredString("Package item description", 255),
  unit_weight: Joi.alternatives().try(Joi.number().positive(), Joi.string().trim().min(1)).required(),
  unit_amount: Joi.alternatives().try(Joi.number().positive(), Joi.string().trim().min(1)).required(),
  quantity: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim().min(1)).required(),
});

const measurementArrayRule = Joi.array()
  .items(
    Joi.object({
      name: Joi.string().trim().required().messages({
        "any.required": "Measurement name is required",
        "string.empty": "Measurement name cannot be empty",
      }),
      value: Joi.string().trim().required().messages({
        "any.required": "Measurement value is required",
        "string.empty": "Measurement value cannot be empty",
      }),
    })
  )
  .min(1)
  .required()
  .messages({
    "array.base": "Measurement must be an array",
    "array.min": "At least one measurement is required",
  });
exports.createRequestValidator = validateBody(
  Joi.object({
    fullName: requiredString("Full name", 100),
    deadLine: dateRule.required().messages({
      "any.required": "Deadline is required",
      "date.format": "Deadline must be a valid ISO date",
    }),
    // measurement: measurementArrayRule.optional(),
    description: requiredString("Description", 2000),
  })
);

exports.requestProgressValidator = validateBody(
  Joi.object({
    status: Joi.string().valid("picked_up", "ready", "delivered", "completed").required().messages({
      "any.only": "Status must be picked_up, ready, delivered, or completed",
      "any.required": "Status is required",
    }),
  })
);

exports.rateDesignerValidator = validateBody(
  Joi.object({
    rating: Joi.number().integer().min(1).max(5).required().messages({
      "any.required": "Rating is required",
      "number.base": "Rating must be a number",
      "number.min": "Rating must be between 1 and 5",
      "number.max": "Rating must be between 1 and 5",
    }),
  })
);

exports.createOrderValidator = validateBody(
  Joi.object({
    requestId: uuidRule.optional(),
    designerId: uuidRule.optional(),
    designId: uuidRule.optional(),
    itemName: requiredString("Item name", 100),
    amount: Joi.number().integer().positive().required().messages({
      "any.required": "Amount is required",
      "number.base": "Amount must be a number",
      "number.positive": "Amount must be greater than 0",
    }),
  }).or("requestId", "designerId")
);

exports.updateOrderStatusValidator = validateBody(
  Joi.object({
    status: Joi.string()
      .valid(
        "new", "preparing", "ready", "completed", "cancelled",
        "picked_up", "pickedUp", "picked-up", "in_production", "delivered",
        "pending", "active"
      )
      .required()
      .messages({
        "any.only": "Status must be pending, active, delivered, completed, cancelled, or legacy statuses (new, preparing, ready)",
        "any.required": "Status is required",
      }),
  })
);

exports.createDesignValidator = validateBody(
  Joi.object({
    designerId: uuidRule.required().messages({
      "any.required": "Designer ID is required",
      "string.guid": "Designer ID must be a valid UUID",
    }),
    designTitle: requiredString("Design title", 100),
    category: requiredString("Category", 100),
    price: amountRule.required().messages({
      "any.required": "Price is required",
      "number.base": "Price must be a number",
      "number.positive": "Price must be greater than 0",
    }),
    description: requiredString("Description", 2000),
    measurement: measurementArrayRule.optional(),
  })
);

exports.updateDesignValidator = validateBody(
  Joi.object({
    designTitle: optionalString("Design title", 100),
    category: optionalString("Category", 100),
    price: amountRule.optional().messages({
      "number.base": "Price must be a number",
      "number.positive": "Price must be greater than 0",
    }),
    description: optionalString("Description", 2000),
    measurement: measurementArrayRule.optional(),
  }).or("designTitle", "category", "price", "description", "measurement"),
  { allowFileOnly: true }
);

exports.createWalletValidator = validateBody(walletSchema);
exports.updateWalletValidator = validateBody(walletUpdateSchema);

exports.designerProfileCreateValidator = validateBody(
  Joi.object({
    ...profileFields,
    businessName: requiredString("Business name", 100),
    currentHouseAddress: requiredString("Current house address", 255),
    phoneNumber: phoneRule.required().messages({
      "any.required": "Phone number is required",
      "string.empty": "Phone number cannot be empty",
    }),
  })
);

exports.designerOnboardingValidator = validateBody(
  Joi.object({
    ...profileFields,
    businessName: requiredString("Business name", 100),
    currentHouseAddress: requiredString("Current house address", 255),
    phoneNumber: phoneRule.required().messages({
      "any.required": "Phone number is required",
      "string.empty": "Phone number cannot be empty",
    }),
    bankName: requiredString("Bank name", 100),
    accountNumber: Joi.string().trim().pattern(/^\d{10}$/).required().messages({
      "any.required": "Account number is required",
      "string.pattern.base": "Account number must be 10 digits",
    }),
    accountName: requiredString("Account name", 100)
  })
);

exports.designerProfileUpdateValidator = validateBody(
  Joi.object(profileFields).or(
    "businessName",
    "currentHouseAddress",
    "phoneNumber",
    "bankName",
    "accountNumber",
    "accountName",
    "specialization",
    "yearsOfExperience",
    "shortBio"
  ),
  { allowFileOnly: true }
);

exports.profileContactValidator = validateBody(
  Joi.object({
    phone: phoneRule.optional().messages({
      "string.empty": "Phone cannot be empty",
      "string.min": "Phone number must be at least 7 characters",
      "string.max": "Phone number cannot be more than 20 characters",
    }),
    address: optionalString("Address", 255),
  }).or("phone", "address")
)

exports.createCollaborationValidator = validateBody(
  Joi.object({
    receiverDesignerId: uuidRule.required().messages({
      "any.required": "Receiver designer ID is required",
      "string.guid": "Receiver designer ID must be a valid UUID",
    }),
    taskType: requiredString("Task type", 100),
    taskDetails: requiredString("Task details", 1000),
    deadline: dateRule.required().messages({
      "any.required": "Deadline is required",
      "date.format": "Deadline must be a valid ISO date",
    }),
    currentAddress: requiredString("Current address", 255),
    offeredPayment: amountRule.required().messages({
      "any.required": "Offered payment is required",
      "number.base": "Offered payment must be a number",
      "number.positive": "Offered payment must be greater than 0",
    }),
  })
);

exports.validateAddressValidator = validateBody(addressSchema);

exports.shippingRatesValidator = validateBody(
  Joi.object({
    sender_address_code: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim().min(1)).required(),
    reciever_address_code: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim().min(1)).required(),
    pickup_date: Joi.date().iso().required(),
    category_id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim().min(1)).required(),
    package_items: Joi.array().items(packageItemSchema).min(1).required(),
    package_dimension: Joi.object({
      length: Joi.number().positive().required(),
      width: Joi.number().positive().required(),
      height: Joi.number().positive().required(),
    }).required(),
  })
);

exports.createShipmentValidator = validateBody(
  Joi.object({
    request_token: requiredString("Request token", 500),
    courier_id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim().min(1)).required(),
    service_code: requiredString("Service code", 100),
    insurance_code: optionalString("Insurance code", 100),
    is_cod_label: Joi.boolean().optional(),
  })
);

exports.initializeShipmentPaymentValidator = validateBody(
  Joi.object({
    orderId: uuidRule.required().messages({
      "any.required": "Order ID is required",
      "string.guid": "Order ID must be a valid UUID",
    }),
    email: Joi.string().email().required().messages({
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
      "string.email": "Invalid Email format",
    }),
    deliveryAddress: requiredString("Delivery address", 255),
  })
);

const withdrawalSchema = Joi.object({
  amount: Joi.number().positive().integer().required().messages({
    "any.required": "Withdrawal amount is required",
    "number.base": "Withdrawal amount must be a number",
    "number.positive": "Withdrawal amount must be greater than 0",
    "number.integer": "Withdrawal amount must be an integer",
  }),
});

exports.withdrawalValidator = validateBody(withdrawalSchema);
exports.resolveBankAccountValidator = validateBody(resolveBankAccountSchema);