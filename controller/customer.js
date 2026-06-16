const { Op } = require("sequelize");
const { Customer, Designer, DesignerProfile, Order, SavedDesigner } = require("../models");
const bcrypt = require("bcrypt");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const {
  emailTemplate,
  resetPasswordTemplate,
  resetPasswordSuccessfulTemplate,
  verificationTextTemplate,
  resetPasswordTextTemplate,
} = require('../utils/emailTemplates')
const { sendSingleEmail } = require('../utils/brevo');
const redisClient = require('../Redis/redisConnection')
const { AppError } = require('../utils/errorHandler');
const {
  VERIFICATION_OTP_TTL_MINUTES,
  RESET_PASSWORD_OTP_TTL_MINUTES,
  RESEND_OTP_COOLDOWN_SECONDS,
  generateNumericOtp,
  getOtpExpiryDate,
  getResendCooldownSeconds,
  setResendCooldown,
} = require('../utils/otp');


exports.createCustomer = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingEmail = await Customer.findOne({ where: { email: normalizedEmail } })
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Customer with this email already exists",
      });
    }
    const otpExpire = getOtpExpiryDate();
    const otp = generateNumericOtp();
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    
    const newCustomer = await Customer.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashPassword,
      otp,
      otpExpire,
      role: "customer",
    });

    await sendSingleEmail({
      email: newCustomer.email,
      subject: "Verify your Stitch Sure email",
      html: emailTemplate(newCustomer.firstName, otp, VERIFICATION_OTP_TTL_MINUTES),
      text: verificationTextTemplate(newCustomer.firstName, otp, VERIFICATION_OTP_TTL_MINUTES),
    });
    await setResendCooldown(redisClient, "customer", newCustomer.email);

    return res.status(201).json({
  success: true,
  message: "Account created successfully. Please check your email for the verification OTP."
});
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp, email } = req.body;

    const customer = await Customer.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (customer.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (customer.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid",
      });
    }

    Object.assign(customer, {
      isEmailVerified: true,
      otp: null,
      otpExpire: null,
    });
    await customer.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully! Welcome to Stitch Sure.",
    });
  } catch (error) {
    next(error);
  }
};

exports.loginCustomer = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingCustomer = await Customer.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    if (existingCustomer.isEmailVerified == false) {
           return res.status(403).json({
            success: false,
            message: 'Please verify your email to continue'
           })
        }
    const correctPassword = await bcrypt.compare(
      password,
      existingCustomer.password,
    );
     if (!correctPassword) {
           return res.status(400).json({
            success: false,
            message: 'Invalid Credentials'
           })     
        }

    const token = jwt.sign(
      {
        id: existingCustomer.id,
        email: existingCustomer.email,
        role: existingCustomer.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    redisClient.del(`customer_${existingCustomer.id}`);
    redisClient.set(`customer_${existingCustomer.id}`, token, {EX: 86400})
    
    const data = {
      id: existingCustomer.id,
      email: existingCustomer.email,
      role: existingCustomer.role,
      firstName: existingCustomer.firstName,
      lastName: existingCustomer.lastName
    };

    res.status(200).json({
      success: true,
      message: "Welcome back! You are now logged in.",
      token,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const existingEmail = await Customer.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!existingEmail) {
      return res.status(404).json({
        success: false,
        message: "Customer with this email does not exist",
      });
    }

    const otp = generateNumericOtp();

    existingEmail.otp = otp;
    existingEmail.otpExpire = getOtpExpiryDate(RESET_PASSWORD_OTP_TTL_MINUTES);

    await existingEmail.save();

    await sendSingleEmail({
      email: existingEmail.email,
      subject: "Reset Your Password",
      html: resetPasswordTemplate(existingEmail.firstName, otp, RESET_PASSWORD_OTP_TTL_MINUTES),
      text: resetPasswordTextTemplate(existingEmail.firstName, otp, RESET_PASSWORD_OTP_TTL_MINUTES),
    });

    return res.status(200).json({
      success: true,
      message: "A reset code has been sent to your email address.",
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const customer = await Customer.findByPk(req.user.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found' 
        });
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    customer.password = hashPassword;
    await customer.save();

    await sendSingleEmail({
      email: customer.email,
      subject: "Password Reset Successful",
      html: resetPasswordSuccessfulTemplate(customer.firstName),
    });

    return res.status(200).json({
      success: true,
      message: "Your password has been reset successfully.",
    });
  } catch (error) {
    next(error);
  }
};

exports.loginWithGoogle = async (req, res, next) => {
  try {
    const customer = req.user;

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Google authentication failed",
      });
    }

    const token = jwt.sign(
      {
        id: customer.id,
        email: customer.email,
        role: customer.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const data = {
      id: customer.id,
      email: customer.email,
      role: customer.role,
      fullName: `${customer.firstName} ${customer.lastName}`,
    };

    res.status(200).json({
      success: true,
      message: "Welcome! Logged in successfully with Google.",
      data,
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCustomerProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, address } = req.body;
    const { id } = req.params;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    let profilePhoto = customer.profilePhoto;

    if (req.file) {
      const filePath = req.file.path;
      const uploadToCloudinary = await cloudinary.uploader.upload(filePath);
      profilePhoto = {
        url: uploadToCloudinary.secure_url,
        publicId: uploadToCloudinary.public_id
      } 
      fs.unlinkSync(filePath);
    }

    await customer.update({
      firstName: firstName || customer.firstName,
      lastName: lastName || customer.lastName,
      email: email || customer.email,
      profilePhoto: profilePhoto,
      phone,
      address
    });

    res.status(200).json({
      success: true,
      message: "Your profile has been updated.",
      data: {
        profilePhoto: customer.profilePhoto,
        phone: customer.phone,
        address: customer.address
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const checkPassword = await bcrypt.compare(
      currentPassword,
      customer.password,
    );

    if (!checkPassword) {
      return res.status(404).json({
        success: false,
        message: "Current password is invalid",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    customer.password = hashPassword;
    await customer.save();
    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
};


exports.resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        const normalizedEmail = email.toLowerCase();
        const user = await Customer.findOne({where: {email: normalizedEmail}})
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          })
        }
        if (user.isEmailVerified) {
          return res.status(400).json({
            success: false,
            message: 'Email is already verified'
          })
        }

        const retryAfter = await getResendCooldownSeconds(redisClient, "customer", normalizedEmail);
        if (retryAfter) {
          return res.status(429).json({
            success: false,
            message: `Please wait ${retryAfter} seconds before requesting another code.`,
            retryAfter
          })
        }

        const otp = generateNumericOtp();
        const otpExpire = getOtpExpiryDate();

        user.otp = otp;
        user.otpExpire = otpExpire;
        await user.save();

        await sendSingleEmail({
          email: user.email,
          subject: "Your new Stitch Sure verification code",
          html: emailTemplate(user.firstName, otp, VERIFICATION_OTP_TTL_MINUTES),
          text: verificationTextTemplate(user.firstName, otp, VERIFICATION_OTP_TTL_MINUTES),
        });
        await setResendCooldown(redisClient, "customer", user.email);

        return res.status(200).json({
          success: true,
          message: 'A new verification code has been sent.',
          retryAfter: RESEND_OTP_COOLDOWN_SECONDS
        })
    } catch (error) {
      next(error);
    }
};

exports.logOut = async (req, res, next) => {
  try {
    const {id, role} = req.user

     if (role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Only customers can perform this action'
      });
    }

    redisClient.del(`customer_${id}`);

    return res.status(200).json({
      success: true,
      message: 'You have been logged out.'
    })
  } catch (error) {
    next(error);
  }
}

exports.getCustomerDashboardStats = async (req, res, next) => {
  try {
    const customerId = req.user.id;

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only customers can perform this action",
      });
    }

    const [activeOrders, completedOrders, savedDesigners] = await Promise.all([
      Order.count({
        where: {
          customerId,
          status: {
            [Op.in]: ["new", "preparing", "ready"],
          },
        },
      }),
      Order.count({
        where: {
          customerId,
          status: "completed",
        },
      }),
      SavedDesigner.count({
        where: { customerId },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Your dashboard statistics are ready.",
      data: {
        activeOrders,
        savedDesigners,
        completedOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.saveDesigner = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { designerId } = req.params;

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only customers can perform this action",
      });
    }

    const designer = await Designer.findByPk(designerId);
    if (!designer) {
      return res.status(404).json({
        success: false,
        message: "Designer not found",
      });
    }

    const [savedDesigner, created] = await SavedDesigner.findOrCreate({
      where: { customerId, designerId },
    });

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created
        ? "Designer added to your favorites."
        : "Designer is already saved.",
      data: savedDesigner,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSavedDesigners = async (req, res, next) => {
  try {
    const customerId = req.user.id;

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only customers can perform this action",
      });
    }

    const savedDesigners = await SavedDesigner.findAll({
      where: { customerId },
      include: [
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName", "email"],
          include: [
            {
              model: DesignerProfile,
              as: "profile",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Your favorite designers list retrieved.",
      data: savedDesigners,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeSavedDesigner = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { designerId } = req.params;

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only customers can perform this action",
      });
    }

    const deletedCount = await SavedDesigner.destroy({
      where: { customerId, designerId },
    });

    if (!deletedCount) {
      return res.status(404).json({
        success: false,
        message: "Saved designer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Designer removed from your favorites.",
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.findAll({
      attributes: { exclude: ["password", "otp", "otpExpire"] },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Customers list retrieved.",
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOneCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      attributes: { exclude: ["password", "otp", "otpExpire"] },
      include: [
        {
          model: Order,
          as: "orders",
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer details retrieved.",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};