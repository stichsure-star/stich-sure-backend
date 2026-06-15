const { Designer, DesignerProfile, DesignerWallet, Designs } = require("../models");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const redisClient = require('../Redis/redisConnection')
const { emailTemplate, resetPasswordTemplate, resetPasswordSuccessfulTemplate } = require('../utils/emailTemplates')
const { sendSingleEmail } = require('../utils/brevo');
const { AppError } = require('../utils/errorHandler');

const reliabilityTiers = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 50 },
  { name: "Gold", min: 90 },
  { name: "Diamond", min: 98 },
];

const getReliabilityTierInfo = (score) => {
  const normalizedScore = Number(score) || 0;
  let currentIndex = 0;

  reliabilityTiers.forEach((tier, index) => {
    if (normalizedScore >= tier.min) {
      currentIndex = index;
    }
  });

  const currentTier = reliabilityTiers[currentIndex];
  const nextTier = reliabilityTiers[currentIndex + 1] || null;

  if (!nextTier) {
    return {
      currentReliabilityTier: currentTier.name,
      nextReliabilityTier: null,
      nextReliabilityTierThreshold: currentTier.min,
      nextReliabilityTierProgress: 100,
      nextReliabilityTierLabel: `${currentTier.name} (${currentTier.min})`,
    };
  }

  const progress = Math.round(
    ((normalizedScore - currentTier.min) / (nextTier.min - currentTier.min)) * 100
  );

  return {
    currentReliabilityTier: currentTier.name,
    nextReliabilityTier: nextTier.name,
    nextReliabilityTierThreshold: nextTier.min,
    nextReliabilityTierProgress: Math.max(0, Math.min(100, progress)),
    nextReliabilityTierLabel: `${nextTier.name} (${nextTier.min})`,
  };
};


exports.createDesigner = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingEmail = await Designer.findOne({ where: { email: normalizedEmail } })
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

    const newDesigner = await Designer.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashPassword,
      otp,
      otpExpire,
      role: "designer",
      isEmailVerified: false,
    });

     await sendSingleEmail({
          email: newDesigner.email,
          subject: "Email Verification",
          html: emailTemplate(newDesigner.firstName, otp),
        });
        
  return res.status(201).json({
  success: true,
  message: "Welcome! Your account was created successfully. Please check your email for the verification code.",
});
  } catch (error) {
    next(error);
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
        success: false,
        message: "Invaid email or password",
      });
    }
     if (existingDesigner.isEmailVerified == false) {
           return res.status(403).json({
            success: false,
            message: 'Please verify your email to continue'
           })
        }
    const checkPassword = await bcrypt.compare(
      password,
      existingDesigner.password,
    );
    if (!checkPassword) {
      return res.status(404).json({
        success: false,
        message: "Invalid credentials",
      });
    }

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
        redisClient.set(`Designer_${existingDesigner.id}`, token, {EX: 86400})

    const data = {
      id: existingDesigner.id,
      email: existingDesigner.email,
      role: existingDesigner.role,
      firstName: existingDesigner.firstName,
      lastName:  existingDesigner.lastName
    }

    res.status(200).json({
      success: true,
      message: "Welcome back! You're now logged in.",
      token,
      data,
    })
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp, email } = req.body;

    const designer = await Designer.findOne({ where: { email: email.toLowerCase() } });

    if (!designer) {
      return res.status(404).json({
        success: false,
        message: "Designer account not found",
      });
    }

    if (designer.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Designer email is already verified",
      });
    }

    if (designer.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (designer.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid",
      });
    }

    await designer.update({
      isEmailVerified: true,
      otp: null,
      otpExpire: null,
    });

    return res.status(200).json({
      success: true,
      message: "Email verified! You can now access your account.",
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;

    const designer = await Designer.findByPk(id);

    if (!designer) {
      return res.status(404).json({
        success: false,
        message: "designer not found",
      });
    }

    const checkPassword = await bcrypt.compare(
      currentPassword,
      designer.password,
    );

    if (!checkPassword) {
      return res.status(404).json({
        success: false,
        message: "Current password is invalid",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    designer.password = hashPassword;
    await designer.save();
    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
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
        success: false,
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

    await sendSingleEmail({
      email: existingEmail.email,
      subject: "Reset Your Password",
      html: resetPasswordTemplate(existingEmail.firstName, otp),
    });

    res.status(200).json({
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

    if (!req.user || !req.user.id) {
      return res.status(401).json({
         success: false,
         message: 'Unauthorized' 
        });
    }

    const designer = await Designer.findByPk(req.user.id);

    if (!designer) {
      return res.status(404).json({
         success: false,
         message: 'Designer not found' 
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    designer.password = hashPassword;
    await designer.save();

    await sendSingleEmail({
      email: designer.email,
      subject: "Password Reset Successful",
      html: resetPasswordSuccessfulTemplate(designer.firstName),
    });

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
}


exports.resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await Designer.findOne({where: {email: email.toLowerCase()}})
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
          message: 'A new verification code has been sent.'
        })
    } catch (error) {
      next(error);
    }
};

exports.logOut = async (req, res, next) => {
  try {
    const {id, role} = req.user

     if (role !== 'designer') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Only designers can perform this action'
      });
    }
    redisClient.del(`Designer_${id}`);

    return res.status(200).json({
      success: true,
      message: 'You have been logged out.'
    })
  } catch (error) {
    next(error);
  }
}

exports.getAllDesigners = async (req, res, next) => {
  try {
    const designers = await Designer.findAll({
      attributes: { exclude: ["password", "otp", "otpExpire"] },
      include: [
        {
          model: DesignerProfile,
          as: "profile",
        },
        {
          model: DesignerWallet,
          as: "wallet",
        },
        {
          model: Designs,
          as: "designs",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const data = designers.map((designer) => {
      const designerData = designer.toJSON();
      if (designerData.profile) {
        designerData.profile = {
          ...designerData.profile,
          ...getReliabilityTierInfo(designerData.profile.reliabilityScore),
          totalEarnings: designerData.wallet?.totalEarnings || 0,
          availableBalance: designerData.wallet?.availableBalance || 0,
          withdrawn: designerData.wallet?.withdrawn || 0,
        };
      }
      return designerData;
    });

    return res.status(200).json({
      success: true,
      message: "Designers list retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOneDesigner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const designer = await Designer.findByPk(id, {
      attributes: { exclude: ["password", "otp", "otpExpire"] },
      include: [
        {
          model: DesignerProfile,
          as: "profile",
        },
        {
          model: DesignerWallet,
          as: "wallet",
        },
        {
          model: Designs,
          as: "designs",
        },
      ],
    });

    if (!designer) {
      return res.status(404).json({
        success: false,
        message: "Designer not found",
      });
    }

    const data = designer.toJSON();
    if (data.profile) {
      data.profile = {
        ...data.profile,
        ...getReliabilityTierInfo(data.profile.reliabilityScore),
        totalEarnings: data.wallet?.totalEarnings || 0,
        availableBalance: data.wallet?.availableBalance || 0,
        withdrawn: data.wallet?.withdrawn || 0,
      };
    }

    return res.status(200).json({
      success: true,
      message: "Designer profile retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
