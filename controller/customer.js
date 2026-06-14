const { Op } = require("sequelize");
const { Customer, Designer, DesignerProfile, Order, SavedDesigner } = require("../models");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const { emailTemplate, resetPasswordTemplate, resetPasswordSuccessfulTemplate } = require('../utils/emailTemplates')
const { sendSingleEmail } = require('../utils/brevo');
const redisClient = require('../Redis/redisConnection')
const { AppError } = require('../utils/errorHandler');


exports.createCustomer = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingEmail = await Customer.findOne({where: {email: email.toLowerCase()}})
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Customer with this email already exists",
      });
    }
    const otpExpire = Date.now() + 5 * 60 * 1000;

const otp = otpGenerator.generate(6, {
  upperCaseAlphabets: false,
  lowerCaseAlphabets: false,
  specialChars: false,
});
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    
    const newCustomer = await Customer.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashPassword,
      otp,
      otpExpire,
      role: "customer",
    });

    await sendSingleEmail({
      email: newCustomer.email,
      subject: "Email Verification",
      html: emailTemplate(newCustomer.firstName, otp),
    });

    return res.status(201).json({
  success: true,
  message: "Account created successfully. Please check your email for the verification OTP.",
  data: {
    id: newCustomer.id,
    firstName: newCustomer.firstName,
    lastName: newCustomer.lastName,
    email: newCustomer.email,
    role: newCustomer.role,
    isEmailVerified: newCustomer.isEmailVerified
  }
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

    if (customer.dataValues.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (customer.dataValues.otp !== otp) {
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
      message: "Your email has been verified successfully.",
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
    redisClient.set(`customer_${ existingCustomer.id}`, token, {EX: 86400})
    
    const data = {
      id: existingCustomer.id,
      email: existingCustomer.email,
      role: existingCustomer.role,
      firstName: existingCustomer.firstName,
      lastName: existingCustomer.lastName
    };

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
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

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    existingEmail.otp = otp;
    existingEmail.otpExpire = new Date(Date.now() + 5 * 60 * 1000);

    await existingEmail.save();

    await sendSingleEmail({
      email: existingEmail.email,
      subject: "Reset Your Password",
      html: resetPasswordTemplate(existingEmail.firstName, otp),
    });

    return res.status(200).json({
      success: true,
      message: "OTP has been sent to your email address. Use it to reset your password.",
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
      fullName: customer.firstName + " " + customer.lastName,
    };

    res.status(200).json({
      success: true,
      message: "Logged in successfully with Google.",
      data,
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCustomerProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;
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
    });

    res.status(200).json({
      success: true,
      message: "Customer profile updated successfully.",
      data: {
        profilePhoto: customer.dataValues.profilePhoto
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
      message: "Your password has been updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};


exports.resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await Customer.findOne({where: {email: email.toLowerCase()}})
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          })
        }

        const otp = otpGenerator.generate(6, {
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });
        const otpExpire = new Date(Date.now() + 5 * 60 * 1000);

        user.otp = otp;
        user.otpExpire = otpExpire;
        await user.save();

        await sendSingleEmail({
          email: user.email,
          subject: "Email Verification",
          html: emailTemplate(user.firstName, otp),
        });

        return res.status(200).json({
          success: true,
          message: 'OTP sent successfully'
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

    await Customer.update({ isEmailVerified: false }, { where: { id } });

    redisClient.del(`customer_${id}`);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
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
      message: "Customer dashboard stats loaded successfully.",
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
        ? "Designer saved successfully."
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
      message: "Saved designers loaded successfully.",
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
      message: "Designer removed from saved designers successfully.",
    });
  } catch (error) {
    next(error);
  }
};
