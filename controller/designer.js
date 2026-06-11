const { Designer } = require("../models");
const { Customer } = require("../models");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const redisClient = require('../Redis/redisConnection')
const { emailTemplate, resetPasswordTemplate, resetPasswordSuccessfulTemplate } = require('../utils/emailTemplates')
const { sendSingleEmail } = require('../utils/brevo');



exports.createDesingner = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    

    const existingEmail = await Designer.findOne({where:{email: email.toLowerCase(), }});
    if (existingEmail) {
      return res.status(404).json({
        message: "Designer with this email already exists",
      });
    }
    const existMail = await Customer.findOne({where: {email: email.toLowerCase()}})
    if(existMail){
      return res.status(404).json({
        message: 'Email already exists'
      })
    }
    const otpExpire = Date.now() + 3 * 60 * 1000;

const otp = otpGenerator.generate(6, {
  upperCaseAlphabets: false,
  lowerCaseAlphabets: false,
  specialChars: false,
});
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newDesigner = await Designer.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
      otp,
      otpExpire,
      role: "designer",
      isEmailVerified: false,
    });
    console.log(otp)

    await newDesigner.save();

     return res.status(201).json({
  success: true,
  message: "Account created successfully. Please check your email for the verification OTP.",
  data: {
    id: newDesigner.id,
    firstName: newDesigner.firstName,
    lastName: newDesigner.lastName,
    email: newDesigner.email,
    role: newDesigner.role,
    isEmailVerified: newDesigner.isEmailVerified  // will return false on signup
  }
});

    (async () => {
      try {
        await sendSingleEmail({
          email: newDesigner.email,
          subject: "Email Verification",
          html: emailTemplate(newDesigner.firstName, otp),
        });
      } catch (error) {
        console.log(error.message);
      }
    })();
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
};

exports.loginDesigner = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingDesigner = await Designer.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!existingDesigner) {
      return res.status(404).json({
        message: "Invaid email or password",
      });
    }
     if (existingDesigner.isEmailVerified == false) {
           return res.status(403).json({
            message: 'Please verify your email to continue'
           })
        }
    const checkPassword = await bcrypt.compare(
      password,
      existingDesigner.password,
    );
    if (!checkPassword) {
      return res.status(404).json({
        message: "Invalid credentials",
      });
    }

    await existingDesigner.save();

    const token = jwt.sign(
      {
        id: existingDesigner.id,
        email: existingDesigner.email,
        role: existingDesigner.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    
        redisClient.del(`Designer_${existingDesigner.id}`);
        redisClient.set(`Designer_${ existingDesigner.id}`, token, {EX: 86400})
    const data = {
      id: existingDesigner.id,
      email: existingDesigner.email,
      role: existingDesigner.role,
      fullName: existingDesigner.firstName + " " + existingDesigner.lastName,
    }

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token,
      data,
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      error: error.message,
    })
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { otp, email } = req.body;

    const designer = await Designer.findOne({ where: { email: email.toLowerCase() } });

    if (!designer) {
      return res.status(404).json({
        message: "Designer account not found",
      });
    }

    if (designer.isEmailVerified) {
      return res.status(400).json({
        message: "Designer email is already verified",
      });
    }

    if (designer.otpExpire < Date.now()) {
      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    if (designer.otp !== otp) {
      return res.status(400).json({
        message: "OTP is invalid",
      });
    }

    Object.assign(designer, {
      isEmailVerified: true,
      otp: null,
      otpExpire: null,
    });
    await designer.save();

    return res.status(200).json({
      success: true,
      message: "Designer email verified successfully.",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const existingEmail = await Designer.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!existingEmail) {
      return res.status(404).json({
        message: `Designer with ${email} doesn't exist`,
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

    res.status(200).json({
      success: true,
      message: "OTP has been sent to your email address. Use it to reset your password.",
    });

    (async () => {
      try {
        await sendSingleEmail({
          email: existingEmail.email,
          subject: "Reset Your Password",
          html: resetPasswordTemplate(existingEmail.firstName, otp),
        });
      } catch (error) {
        console.log(error.message);
      }
    })();
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    })
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
         message: 'Unauthorized' 
        });
    }

    const designer = await Designer.findByPk(req.user.id);

    if (!designer) {
      return res.status(404).json({
         message: 'Designer not found' 
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    designer.password = hashPassword;
    await designer.save();
    res.status(200).json({
      success: true,
      message: "Designer password reset successfully.",
    });

    (async () => {
      try {
        await sendSingleEmail({
          email: designer.email,
          subject: "Password Reset Successful",
          html: resetPasswordSuccessfulTemplate(designer.firstName),
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
}

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await Designer.findOne({where: {email: email.toLowerCase()}})
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
        const otpExpire = Date.now() + 3 * 60 * 1000;

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

     if (role !== 'designer') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Only designers can perform this action'
      });
    }
    await Designer.update({ isEmailVerified: false }, { where: { id } });
    redisClient.del(`Designer_${id}`);

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
