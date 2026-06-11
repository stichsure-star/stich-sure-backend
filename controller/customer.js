const { Customer } = require("../models");
const { Designer } = require("../models");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const { emailTemplate, resetPasswordTemplate, resetPasswordSuccessfulTemplate } = require('../utils/emailTemplates')
const { sendSingleEmail } = require('../utils/brevo');
const redisClient = require('../Redis/redisConnection')


exports.createCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingEmail = await Customer.findOne({where: {email: email.toLowerCase()}})
    if (existingEmail) {
      return res.status(409).json({
        message: "Customer with this email already exists",
      });
    }
    const existingDesigner = await Designer.findOne({
      where: { email },
    });

    if (existingDesigner) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered as a designer",
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
    isEmailVerified: newCustomer.isEmailVerified  // will return false on signup
  }
});
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    })
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { otp, email } = req.body;

    const customer = await Customer.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    if (customer.dataValues.otpExpire < Date.now()) {
      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    if (customer.dataValues.otp !== otp) {
      return res.status(400).json({
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
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    })
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
        message: "Invalid email or password",
      });
    }
    if (existingCustomer.isEmailVerified == false) {
           return next({
            message: 'Please verify your email to continue',
            statusCode: 403
           })
        }
    const correctPassword = await bcrypt.compare(
      password,
      existingCustomer.password,
    );
     if (!correctPassword) {
           return res.status(400).json({
            message: 'Invalid Credentials'
           })     
        }

    await existingCustomer.save();

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
      fullName: existingCustomer.firstName + " " + existingCustomer.lastName,
    };

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token,
      data,
    });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    })
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const existingEmail = await Customer.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!existingEmail) {
      return res.status(404).json({
        message: "Customer with this email does not exist",
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log(otp);

    existingEmail.otp = otp;
    existingEmail.otpExpire = new Date(Date.now() + 10 * 60 * 1000);

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
    console.log(error.message)
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    })
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const customer = await Customer.findByPk(req.user.id);
    if (!customer) {
      return res.status(404).json({
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
    console.log(error.message)
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    })
  }
};

exports.loginWithGoogle = async (req, res) => {
  try {
    const customer = req.user;

    if (!customer) {
      return res.status(401).json({
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
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    })
  }
};

exports.updateCustomerProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const { id } = req.params;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    let profilePhoto = customer.profilePhoto;

    if (req.file) {
      const filePath = req.file.path;
      const uploadToCloudinary = await cloudinary.uploader.upload(filePath);
      profilePhoto = uploadToCloudinary.secure_url;
      fs.unlinkSync(filePath);
    }

    const updatedCustomer = await customer.update({
      firstName: firstName || customer.firstName,
      lastName: lastName || customer.lastName,
      email: email || customer.email,
      profilePhoto: profilePhoto,
    });

    res.status(200).json({
      success: true,
      message: "Customer profile updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const checkPassword = await bcrypt.compare(
      currentPassword,
      customer.password,
    );

    if (!checkPassword) {
      return res.status(404).json({
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
    console.log(error.message)
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    })
  }
};


exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await Customer.findOne({where: {email: email.toLowerCase()}})
        if (!user) {
          return res.status(404).json({
            message: 'User not found'
          })
        }

        const otp = otpGenerator.generate(6, {
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

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
      console.log(error.message)
     return res.status(500).json({
        message: 'Something went wrong'
     })
    }
};

exports.logOut = async (req, res) => {
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
    console.log(error.message);
    return res.status(500).json({
      message: 'Something went wrong'
    })
  }
}
