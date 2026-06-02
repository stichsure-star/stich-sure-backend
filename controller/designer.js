const { Designer }  = require('../models');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');
const cloudinary = require('../config/cloudinary')

exports.createDesingner  = async (req, res) => {
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
        const existingEmail = await Designer.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(404).json({
                message: 'Designer with this email already exists'
            })
        }

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        })

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newDesigner = await Designer.create({
            firstName,
            lastName,
            email,
            password: hashPassword,
            otp,
            profilePhoto,
            imagesPaths
        })

        isEmailVerified = false

        res.status(200).json({
            message: 'Designer created successfully',
            data: newDesigner
        })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            error: error.message
        })
    }
}
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const existingEmail = await Designer.findOne({ where: { email: email.toLowerCase() }, });
    if (!existingEmail) {
      return res.status(404).json({
        message: "Designer with email does not exist",
      });
    }

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false,lowerCaseAlphabets: false, specialChars: false, });
    console.log(otp);

    existingEmail.otp = otp;
    existingEmail.otpExpire = new Date(Date.now() + 24 * 60 * 60000);

    await existingEmail.save();

    res.status(200).json({
      message: "Otp sent successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Something went wrong'
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const existingDesigner = await Designer.findOne({ where: { otp } });
    if (!existingDesigner) {
      return res.status(404).json({
        message: "Invalid OTP",
      });
    }
    if (existingDesigner.otpExpire < new Date()) {
      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    existingDesigner.isEmailVerified = true;
    existingDesigner.otp = null;
    existingDesigner.otpExpire = null;
    await existingDesigner.save();

    res.status(200).json({
      message: "OTP verified successfully",
      data: existingDesigner,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.getAlldesigners = async (rea, res) => {

  try {

    const getAll = await Designer.findAll()

    return res.status(200).json({

      message: 'All designers retrived'
    })
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: 'Something went wrong'
    })
  }
};

exports.getOneDesigner = async (req, res) => {
  try {
    const { id } = req.params;

    const oneDesigner = await Designer.findByPk(id)

    if(!oneDesigner) {
      return res.status(404).json({
        message: 'Designer does not exist'
      })
    };

    return res.status(200).json({
      message: 'Designer retrived'
    })

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: 'Something went wrong'
    })
  }
}