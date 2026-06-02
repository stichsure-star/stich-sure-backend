const { Customer } = require("../models");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const cloudinary = require('../config/cloudinary')
const fs = require('fs')

exports.createCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const imagesPaths = req.files.map((img) => img.path);
    console.log('imagePath: ', imagesPaths);

    profilePhoto = []
    imagesPaths = []
    
    for(const path of imagesPaths) {
      const result = await cloudinary.uploader.upload(path)
      console.log('result', result);

      profilePhoto.push(result.secure_url)
      imagesPaths.push(result.public_id)
    }
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const existingEmail = await Customer.findOne({where: { email: email.toLowerCase() },});
    if (existingEmail) {
      return res.status(404).json({
        message: "Customer with this email already exists",
      });
    }

    const otpExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newCustomer = await Customer.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
      profilePhoto,
      imagesPaths,
      otp,
      otpExpire,
      role: "customer",
    });

    isEmailVerified = false;
    await newCustomer.save();

    res.status(200).json({
      message: "Customer created successfully",
      data: newCustomer,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.loginCustomer = async (req, res) => {
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
    const correctPassword = await bcrypt.compare(
      password,
      existingCustomer.password,
    );
     if (!correctPassword) {
            // Increment login attempts and lock acccount if neccessary
            user.loginAttempts += 1;
            if(user.loginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 2 * 60000);
                user.loginAttempts = 0;
            }
            await user.save();
            console.log(user.loginAttempts);
           return next({
            message: 'Invalid Credentials',
            statusCode: 400
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
      message: "Customer logged in successfully",
      token,
      data: existingCustomer,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
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
      message: "Otp sent successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const existingCustomer = await Customer.findOne({
      where: { otp },
    });
    if (!existingCustomer) {
      return res.status(404).json({
        message: "Invalid OTP",
      });
    }
    if (existingCustomer.otpExpire < new Date()) {
      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    existingCustomer.isEmailVerified = true;
    existingCustomer.otp = null;
    existingCustomer.otpExpire = null;
    await existingCustomer.save();

    res.status(200).json({
      message: "OTP verified successfully",
      data: existingCustomer,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
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
      message: "Login successfully",
      data: customer,
      token,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try{
    const {customerId} = req.params;
    const {firstName, lastName, email, profilePhoto, address} = req.body;

    const existingCustomer = await Customer.findByPk(customerId);
    if(!existingCustomer){
      return res.status(404).json({
        message: "Customer not found",
      });
    }
    const updatedCustomer = await Customer.update({ firstName,lastName, email, profilePhoto, address }, {where: { id: customerId } });
    return res.status(200).json({
      message: 'User updated successfully'
    })
  }catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Something went wrong'
    });
  }
}
