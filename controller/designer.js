const { Designer } = require("../models");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");

const otpExpire = Date.now() + 3 * 60 * 1000;

const otp = otpGenerator.generate(6, {
  upperCaseAlphabets: false,
  lowerCaseAlphabets: false,
  specialChars: false,
});

exports.createDesingner = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    

    const existingEmail = await Designer.findOne({where:{email: email.toLowerCase(), }});
    if (existingEmail) {
      return res.status(404).json({
        message: "Designer with this email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newDesiner = await Designer.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
      otp,
      otpExpire,
      role: "designer",
    });
    console.log(otp)

    isEmailVerified = false;
    await newDesiner.save();

    res.status(200).json({
      success: true,
      message: "Designer account created successfully. Please check your email for verification instructions.",
    });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
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

    res.status(200).json({
      success: true,
      message: "Designer logged in successfully.",
      data: existingDesigner,
      token,
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      success: false,
      message: 'Something wrong'
    })
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
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      message: "Something went wrong"
    })
  }
}
