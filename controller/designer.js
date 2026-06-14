const { Designer, Customer, DesignerProfile, Designs, request } = require("../models");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const redisClient = require('../Redis/redisConnection')
const { emailTemplate, resetPasswordTemplate, resetPasswordSuccessfulTemplate } = require('../utils/emailTemplates')
const { sendSingleEmail } = require('../utils/brevo');
const { AppError } = require('../utils/errorHandler');

// ──────────────────────────────────────────────
// AUTH FUNCTIONS
// ──────────────────────────────────────────────

exports.createDesingner = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingEmail = await Designer.findOne({where:{email: email.toLowerCase(), }});
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Designer with this email already exists",
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
      email,
      password: hashPassword,
      otp,
      otpExpire,
      role: "designer",
      isEmailVerified: false,
    });

    await newDesigner.save();

     await sendSingleEmail({
          email: newDesigner.email,
          subject: "Email Verification",
          html: emailTemplate(newDesigner.firstName, otp),
        });
        
  return res.status(201).json({
  success: true,
  message: "Account created successfully. Please check your email for the verification OTP.",
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
      firstName: existingDesigner.firstName,
      lastName:  existingDesigner.lastName
    }

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
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
      message: "OTP has been sent to your email address. Use it to reset your password.",
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
    res.status(200).json({
      success: true,
      message: "Designer password reset successfully.",
    });

    await sendSingleEmail({
      email: designer.email,
      subject: "Password Reset Successful",
      html: resetPasswordSuccessfulTemplate(designer.firstName),
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
          message: 'OTP sent successfully'
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
    await Designer.update({ isEmailVerified: false }, { where: { id } });
    redisClient.del(`Designer_${id}`);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    next(error);
  }
}

// ──────────────────────────────────────────────
// PROFILE HELPER FUNCTIONS
// ──────────────────────────────────────────────

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

const parseSpecialization = (specialization) => {
  if (!specialization) {
    return specialization;
  }

  if (Array.isArray(specialization)) {
    return specialization;
  }

  try {
    return JSON.parse(specialization);
  } catch (error) {
    return specialization;
  }
};

const getHoursBetween = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return null;
  }

  return (new Date(endDate).getTime() - new Date(startDate).getTime()) / 36e5;
};

const formatDuration = (hours) => {
  if (!hours || hours <= 0) {
    return "0 hrs";
  }

  if (hours < 24) {
    return `${Math.round(hours)} hrs`;
  }

  return `${Math.round(hours / 24)} days`;
};

const average = (numbers) => {
  if (!numbers.length) {
    return 0;
  }

  return numbers.reduce((total, number) => total + number, 0) / numbers.length;
};

// ──────────────────────────────────────────────
// PROFILE CONTROLLERS
// ──────────────────────────────────────────────

// POST /designers/profile  —  Create or upsert a designer profile
exports.createOrUpdateProfile = async (req, res, next) => {
  try {
    const designerId = req.user.id;

    const {
      businessName,
      currentHouseAddress,
      specialization,
      yearsOfExperience,
      shortBio,
    } = req.body;
    const parsedSpecialization = parseSpecialization(specialization);

    let profile = await DesignerProfile.findOne({
      where: { designerId },
    });

    let profilePhoto = profile ? profile.profilePhoto : null;

    if (req.file) {
      const filePath = req.file.path;
      const uploadToCloudinary = await cloudinary.uploader.upload(filePath);
      profilePhoto = uploadToCloudinary.secure_url;
      fs.unlinkSync(filePath);
    }

    const isProfileCompleted =
      businessName &&
      currentHouseAddress &&
      parsedSpecialization &&
      yearsOfExperience &&
      shortBio &&
      profilePhoto;

    if (profile) {
      await profile.update({
        businessName,
        currentHouseAddress,
        specialization: parsedSpecialization,
        yearsOfExperience,
        shortBio,
        profilePhoto,
        isProfileCompleted: !!isProfileCompleted,
      });
    } else {
      profile = await DesignerProfile.create({
        designerId,
        businessName,
        currentHouseAddress,
        specialization: parsedSpecialization,
        yearsOfExperience,
        shortBio,
        profilePhoto,
        isProfileCompleted: !!isProfileCompleted,
      });
    }

    res.status(200).json({
      success: true,
      message: "Designer profile saved successfully.",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// GET /designers  —  Get all designer profiles (public)
exports.getAllProfiles = async (req, res, next) => {
  try {
    const designers = await Designer.findAll({
      attributes: ["id", "firstName", "lastName", "email"],
      include: [
        {
          model: DesignerProfile,
          as: "profile",
        },
        {
          model: Designs,
          as: "designs",
        },
      ],
    });

    const data = designers.map((designer) => {
      const designerData = designer.toJSON();
      if (designerData.profile) {
        designerData.profile = {
          ...designerData.profile,
          ...getReliabilityTierInfo(designerData.profile.reliabilityScore),
        };
      }
      return designerData;
    });

    res.status(200).json({
      success: true,
      message: "All designer profiles have been loaded successfully.",
      data,
    });
  } catch (error) {
    next(error)
  }
};

// GET /designers/profile/:designerId  —  Get a single designer's profile (public)
exports.getProfile = async (req, res, next) => {
  try {
    const { designerId } = req.params;

    const designer = await Designer.findByPk(designerId, {
      attributes: ["id", "firstName", "lastName", "email"],
      include: [
        {
          model: DesignerProfile,
          as: "profile",
        },
        {
          model: Designs,
          as: "designs",
        },
      ],
    });

    if (!designer) {
      return res.status(404).json({
        message: 'Designer not found'
      });
    }

    const data = designer.toJSON();
    if (data.profile) {
      data.profile = {
        ...data.profile,
        ...getReliabilityTierInfo(data.profile.reliabilityScore),
      };
    }

    res.status(200).json({
      success: true,
      message: "Designer profile has been loaded successfully.",
      data,
    });
  } catch (error) {
    next(error)
  }
};

// PUT /designers/profile  —  Update own profile
exports.updateProfile = async (req, res, next) => {
  try {
    const designerId = req.user.id;
    const {
      businessName,
      currentHouseAddress,
      specialization,
      yearsOfExperience,
      shortBio,
    } = req.body;

    const profile = await DesignerProfile.findOne({
      where: { designerId },
    });

    if (!profile) {
      return res.status(404).json({
        message: "Designer profile not found",
      });
    }

    let profilePhoto = profile.profilePhoto;

    if (req.file) {
      const filePath = req.file.path;
      const uploadToCloudinary = await cloudinary.uploader.upload(filePath);
      profilePhoto = uploadToCloudinary.secure_url;
      fs.unlinkSync(filePath);
    }

    const updatedBusinessName = businessName || profile.businessName;
    const updatedCurrentHouseAddress =
      currentHouseAddress || profile.currentHouseAddress;
    const updatedSpecialization = specialization
      ? parseSpecialization(specialization)
      : profile.specialization;
    const updatedYearsOfExperience =
      yearsOfExperience || profile.yearsOfExperience;
    const updatedShortBio = shortBio || profile.shortBio;

    const isProfileCompleted =
      updatedBusinessName &&
      updatedCurrentHouseAddress &&
      updatedSpecialization &&
      updatedYearsOfExperience &&
      updatedShortBio &&
      profilePhoto;

    await profile.update({
      businessName: updatedBusinessName,
      currentHouseAddress: updatedCurrentHouseAddress,
      specialization: updatedSpecialization,
      yearsOfExperience: updatedYearsOfExperience,
      shortBio: updatedShortBio,
      profilePhoto,
      isProfileCompleted: !!isProfileCompleted,
    });

    res.status(200).json({
      success: true,
      message: "Designer profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    next(error)
  }
};


exports.deleteProfile = async (req, res, next) => {
  try {
    const designerId = req.user.id;

    const profile = await DesignerProfile.findOne({
      where: { designerId },
    });

    if (!profile) {
      return res.status(404).json({
        message: "Designer profile not found",
      });
    }

    await profile.destroy();

    res.status(200).json({
      success: true,
      message: "Designer profile deleted successfully.",
    });
  } catch (error) {
    next(error)
  }
};


exports.getDashboardStats = async (req, res, next) => {
  try {
    const designerId = req.user.id;

    const profile = await DesignerProfile.findOne({
      where: { designerId },
    });

    const requests = await request.findAll({
      where: { designerId },
      order: [["createdAt", "DESC"]],
    });

    const completedRequests = requests.filter((item) => item.status === "completed");
    const acceptedRequests = requests.filter((item) =>
      ["accepted", "picked_up", "ready", "completed"].includes(item.status)
    );

    const reliabilityScore =
      acceptedRequests.length === 0
        ? 0
        : Math.round((completedRequests.length / acceptedRequests.length) * 100);

    const onTimeRequests = completedRequests.filter((item) => {
      if (!item.deadLine || !item.completedAt) {
        return false;
      }

      return new Date(item.completedAt).getTime() <= new Date(item.deadLine).getTime();
    });

    const onTimeRate =
      completedRequests.length === 0
        ? 0
        : Math.round((onTimeRequests.length / completedRequests.length) * 100);

    const deliveryHours = completedRequests
      .map((item) => getHoursBetween(item.pickedUpAt || item.createdAt, item.completedAt))
      .filter((hours) => hours !== null && hours >= 0);

    const responseHours = requests
      .filter((item) => item.offerSentAt)
      .map((item) => getHoursBetween(item.createdAt, item.offerSentAt))
      .filter((hours) => hours !== null && hours >= 0);

    const ratingAverage = Number(profile?.ratingAverage || 0);
    const ratingCount = Number(profile?.ratingCount || 0);

    if (profile) {
      await profile.update({
        completedOrders: completedRequests.length,
        reliabilityScore,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Designer dashboard stats loaded successfully.",
      data: {
        reliabilityScore,
        reliabilityLabel: `${reliabilityScore}/100`,
        ...getReliabilityTierInfo(reliabilityScore),
        totalOrders: requests.length,
        activeOrders: requests.filter((item) =>
          ["accepted", "picked_up", "ready"].includes(item.status)
        ).length,
        completedOrders: completedRequests.length,
        onTimeRate,
        onTimeRateLabel: `${onTimeRate}%`,
        averageDeliveryTime: formatDuration(average(deliveryHours)),
        customerSatisfaction: Number(ratingAverage.toFixed(1)),
        customerSatisfactionLabel: `${ratingAverage.toFixed(1)}/5`,
        ratingCount,
        responseTime: formatDuration(average(responseHours)),
      },
    });
  } catch (error) {
    next(error)
  }
};


