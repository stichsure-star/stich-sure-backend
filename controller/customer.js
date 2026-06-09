const { Customer } = require("../models");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const {signUpTemplate} = require('../utils/emailTemplates')
const { sendSingleEmail } = require('../utils/brevo');
const otpExpire = Date.now() + 3 * 60 * 1000;

const otp = otpGenerator.generate(6, {
  upperCaseAlphabets: false,
  lowerCaseAlphabets: false,
  specialChars: false,
});

exports.createCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingEmail = await Customer.findOne({where: {email: email.toLowerCase()}})
    if (existingEmail) {
      return res.status(404).json({
        message: "Customer with this email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newCustomer = await Customer.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
      otp,
      otpExpire,
      role: "customer",
    });

    res.status(200).json({
      success: true,
      message:
        "Account created successfully. Please check your email for the verification OTP.",
    });

    (async () => {
      try {
        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Document</title>
              <style>
                  *{

                      margin: 0;
                      padding: 0;
                      box-sizing: border-box;
                  }
              </style>
          </head>
          <body>
              <h1>Email Verification</h1>
              <h3>Hello ${newCustomer.dataValues.firstName} ${newCustomer.dataValues.lastName}, Please enter the otp below to verify your email</h3>
              <h3>${newCustomer.dataValues.otp}</h3> 
              <h3>This otp will expire in 3 minutes</h3>
          </body>
          </html>
        `;
        await sendSingleEmail({
          email: newCustomer.dataValues.email,
          subject: "Email Verification",
          html: signUpTemplate(newCustomer.dataValues.firstName, otp),
        });
      } catch (error) {
        console.log(error.message);
      }
    })();
  } catch (error) {
    console.log(error.message)
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
    console.log( 'existingCustomer:', existingCustomer)
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
    res.status(200).json({
      success: true,
      
      message: "Customer logged in successfully.",
      token,
      data: existingCustomer,
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
    existingEmail.otpExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await existingEmail.save();

    res.status(200).json({
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
    res.status(200).json({
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

    res.status(200).json({
      success: true,
      message: "Logged in successfully with Google.",
      data: customer,
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


exports.resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await Designer.findOne({where: {email: email.toLowerCase()}})
        if (!user) {
        return next ({
            message: 'User not found',
            statusCode: 404 
        })
        }

        const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });

        const otpExpire = Date.now() + 3 * 60 * 1000;

        user.otp = otp;
        user.otpExpiresAt = otpExpire;
        await user.save()

        return next({
        message:  'OTP sent successfully',
        statusCode: 200
       })
  (async () => {
          try {
            const html = `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Document</title>
                  <style>
                      *{
    
                          margin: 0;
                          padding: 0;
                          box-sizing: border-box;
                      }
                  </style>
              </head>
              <body>
                  <h1>Email Verification</h1>
                  <h3>Hello ${user.dataValues.firstName} ${user.dataValues.lastName}, Please enter the otp below to verify your email</h3>
                  <h3>${user.dataValues.otp}</h3> 
                  <h3>This otp will expire in 3 minutes</h3>
              </body>
              </html>
            `;
            await sendSingleEmail({
              email: user.dataValues.email,
              subject: "Email Verification",
              html: signUpTemplate(user.dataValues.firstName, otp),
            });
          } catch (error) {
            console.log(error.message);
          }
          })();
    } catch (error) {
     return next({
        error: error.message,
        statusCode: 500
     })
    }
};
