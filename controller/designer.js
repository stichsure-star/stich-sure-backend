const  Designer  = require("../models/designer");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");


exports.createDesingner = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    
    const otpExpire = Date.now() + 3 * 60 * 1000;

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

    isEmailVerified = false;
    await newDesiner.save();

    res.status(200).json({
      message: "Designer created successfully",
      data: newDesiner,
    });
  } catch (error) {
    return next(error)
  }
};

exports.loginDesigner = async (req, res, next) => {
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
  } catch (error) {
    return next(error)
  }
};

exports.forgetPassword = async (req, res, next) => {
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
      message: "Otp sent successfully",
    });
  } catch (error) {
    return next(error)
    
  }
};

exports.setPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const customer = await Designer.findByPk(req.user.id);

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    customer.password = hashPassword;
    await Designer.save();
    res.status(200).json({
      message: "Password set successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
}
