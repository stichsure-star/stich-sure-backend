const { sequelize, Designer, DesignerProfile, DesignerWallet, Designs, request } = require("../models");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
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

const sanitizeProfileResponse = (profile) => {
  if (!profile) return profile;

  const data = profile.toJSON ? profile.toJSON() : { ...profile };
  const { kycDocument, ...rest } = data;

  return rest;
};

// exports.createOrUpdateDesignerProfile = async (req, res, next) => {
//   try {
//     const designerId = req.user.id;

//     const {
//       businessName,
//       currentHouseAddress,
//       phoneNumber,
//       bankName,
//       accountNumber,
//       accountName,
//       specialization,
//       yearsOfExperience,
//       shortBio,
//       firstName,
//       lastName
//     } = req.body;
//     const parsedSpecialization = parseSpecialization(specialization);

//     if (!businessName || !currentHouseAddress || !phoneNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "Business name, current house address, and phone number are required.",
//       });
//     }

//     let profile = await DesignerProfile.findOne({
//       where: { designerId },
//     });

//     let profilePhoto = profile ? profile.profilePhoto : null;

//     if (req.file) {
//       const filePath = req.file.path;
//       const uploadToCloudinary = await cloudinary.uploader.upload(filePath);
//       profilePhoto = uploadToCloudinary.secure_url;
//       fs.unlinkSync(filePath);
//     }

//     const isProfileCompleted =
//       businessName &&
//       currentHouseAddress &&
//       phoneNumber &&
//       parsedSpecialization &&
//       yearsOfExperience &&
//       shortBio &&
//       profilePhoto &&
//       firstName &&
//       lastName

//     if (profile) {
//       await profile.update({
//         businessName,
//         currentHouseAddress,
//         phoneNumber,
//         bankName,
//         accountNumber,
//         accountName,
//         specialization: parsedSpecialization,
//         yearsOfExperience,
//         shortBio,
//         profilePhoto,
//         firstName,
//         lastName,
//         isProfileCompleted: !!isProfileCompleted,
//       });
//     } else {
//       profile = await DesignerProfile.create({
//         designerId,
//         businessName,
//         currentHouseAddress,
//         phoneNumber,
//         bankName,
//         accountNumber,
//         accountName,
//         specialization: parsedSpecialization,
//         yearsOfExperience,
//         shortBio,
//         profilePhoto,
//         isProfileCompleted: !!isProfileCompleted,
//         firstName,
//         lastName
//       });
//     }


//     let wallet = await DesignerWallet.findOne({
//       where: { designerId },
//     });

//     if (wallet) {
//       await wallet.update({
//         bankName: bankName || wallet.bankName,
//         accountNumber: accountNumber || wallet.accountNumber,
//         accountName: accountName || wallet.accountName,
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Your profile has been saved.",
//       data: sanitizeProfileResponse(profile),
//     });
//   } catch (error) {
//     next(error);
//   }
// };

exports.createOrUpdateDesignerOnboarding = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const designerId = req.user.id;
    const {
      businessName,
      currentHouseAddress,
      state,
      country,
      phoneNumber,
      specialization,
      yearsOfExperience,
      shortBio,
      bankName,
      accountNumber,
      accountName,
      firstName,
      lastName
    } = req.body;

    if (!businessName || !currentHouseAddress || !state || !country || !phoneNumber) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Business name, current house address, state, country, and phone number are required.",
      });
    }

    if (!bankName || !accountNumber || !accountName) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Bank name, account number, and account name are required.",
      });
    }

    const parsedSpecialization = parseSpecialization(specialization);

    let profile = await DesignerProfile.findOne({
      where: { designerId },
      transaction,
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
      state &&
      country &&
      phoneNumber &&
      parsedSpecialization &&
      yearsOfExperience &&
      shortBio &&
      firstName &&
      lastName &&
      profilePhoto;

    const profilePayload = {
      designerId,
      businessName,
      currentHouseAddress,
      state,
      country,
      phoneNumber,
      bankName,
      accountNumber,
      accountName,
      specialization: parsedSpecialization,
      yearsOfExperience,
      shortBio,
      profilePhoto,
      firstName,
      lastName,
      isProfileCompleted: !!isProfileCompleted,
      isKycVerified: true,
      kycStatus: "approved",
    };

    if (profile) {
      await profile.update(profilePayload, { transaction });
    } else {
      profile = await DesignerProfile.create(profilePayload, { transaction });
    }

    let wallet = await DesignerWallet.findOne({
      where: { designerId },
      transaction,
    });

    const walletPayload = {
      designerId,
      bankName,
      accountNumber,
      accountName,
    };

    if (wallet) {
      await wallet.update(walletPayload, { transaction });
    } else {
      wallet = await DesignerWallet.create(walletPayload, { transaction });
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Welcome aboard! Your profile and wallet are set up.",
      data: {
        profile: sanitizeProfileResponse(profile),
        wallet,
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.getAllDesignerProfiles = async (req, res, next) => {
  try {
    const designers = await Designer.findAll({
      attributes: ["id", "firstName", "lastName", "email"],
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
          ...sanitizeProfileResponse(designerData.profile),
          ...getReliabilityTierInfo(designerData.profile.reliabilityScore),
          totalEarnings: designerData.wallet?.totalEarnings || 0,
          availableBalance: designerData.wallet?.availableBalance || 0,
          withdrawn: designerData.wallet?.withdrawn || 0,
        };
      }
      return designerData;
    });

    res.status(200).json({
      success: true,
      message: "Designer profiles retrieved.",
      data,
    });
  } catch (error) {
    next(error)
  }
};

exports.getFeaturedDesigners = async (req, res, next) => {
  try {
    const designers = await Designer.findAll({
      attributes: ["id", "firstName", "lastName", "email"],
      include: [
        {
          model: DesignerProfile,
          as: "profile",
          required: true,
          where: {
            isProfileCompleted: true,
          },
        },
        {
          model: DesignerWallet,
          as: "wallet",
        },
        {
          model: Designs,
          as: "designs",
          separate: true,
        },
      ],
      order: [
        [{ model: DesignerProfile, as: "profile" }, "reliabilityScore", "DESC"],
        [{ model: DesignerProfile, as: "profile" }, "ratingAverage", "DESC"],
      ],
      limit: 3,
    });

    const data = designers.map((designer) => {
      const designerData = designer.toJSON();
      if (designerData.profile) {
        designerData.profile = {
          ...sanitizeProfileResponse(designerData.profile),
          ...getReliabilityTierInfo(designerData.profile.reliabilityScore),
          totalEarnings: designerData.wallet?.totalEarnings || 0,
          availableBalance: designerData.wallet?.availableBalance || 0,
          withdrawn: designerData.wallet?.withdrawn || 0,
        };
      }
      return designerData;
    });

    res.status(200).json({
      success: true,
      message: "Top three featured designers retrieved.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDesignerProfile = async (req, res, next) => {
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
        message: 'Designer not found'
      });
    }

    const data = designer.toJSON();
    if (data.profile) {
      data.profile = {
        ...sanitizeProfileResponse(data.profile),
        ...getReliabilityTierInfo(data.profile.reliabilityScore),
        totalEarnings: data.wallet?.totalEarnings || 0,
        availableBalance: data.wallet?.availableBalance || 0,
        withdrawn: data.wallet?.withdrawn || 0,
      };
    }

    res.status(200).json({
      success: true,
      message: "Designer profile retrieved.",
      data,
    });
  } catch (error) {
    next(error)
  }
};

exports.getDesignerDashboardStats = async (req, res, next) => {
  try {
    const designerId = req.user.id;

    const profile = await DesignerProfile.findOne({
      where: { designerId },
    });

    const wallet = await DesignerWallet.findOne({
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

    return res.status(200).json({
      success: true,
      message: "Your performance stats are ready.",
      data: {
        source: "requests",
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
        totalEarnings: wallet?.totalEarnings || 0,
        availableBalance: wallet?.availableBalance || 0,
        withdrawn: wallet?.withdrawn || 0,
      },
    });
  } catch (error) {
    next(error)
  }
};

exports.getDesignerOrderDashboardStats = async (req, res, next) => {
  try {
    const designerId = req.user.id;

    const { Order, DesignerProfile, DesignerWallet } = require("../models");

    const profile = await DesignerProfile.findOne({
      where: { designerId },
    });

    const wallet = await DesignerWallet.findOne({
      where: { designerId },
    });

    const allOrders = await Order.findAll({
      where: { designerId },
      order: [["placedAt", "DESC"]],
    });

    const activeOrders = allOrders.filter((item) =>
      ["active", "delivered"].includes(item.status)
    ).length;

    const completedOrders = allOrders.filter(
      (item) => item.status === "completed"
    ).length;

    const totalEarnings = Number(wallet?.totalEarnings || 0);

    const ratingAverage = Number(profile?.ratingAverage || 0);
    const ratingCount = Number(profile?.ratingCount || 0);

    const reliabilityScore =
      allOrders.length === 0
        ? 100
        : Math.round((completedOrders / allOrders.length) * 100);

    return res.status(200).json({
      success: true,
      message: "Your order dashboard stats are ready.",
      data: {
        source: "orders",
        activeOrders,
        totalEarnings,
        avgRating: Number(ratingAverage.toFixed(1)),
        avgRatingLabel: `${ratingAverage.toFixed(1)}/5`,
        ratingCount,
        completedOrders,
        totalOrders: allOrders.length,
        cancelledOrders: allOrders.filter((item) => item.status === "cancelled").length,
        pendingOrders: allOrders.filter((item) => item.status === "pending").length,
        reliabilityScore,
        reliabilityLabel: `${reliabilityScore}/100`,
        ...getReliabilityTierInfo(reliabilityScore),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDesignerProfile = async (req, res, next) => {
  try {
    const designerId = req.user.id;
    const {
      businessName,
      currentHouseAddress,
      state,
      country,
      phoneNumber,
      bankName,
      accountNumber,
      accountName,
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
    const updatedState = state || profile.state;
    const updatedCountry = country || profile.country;
    const updatedPhoneNumber = phoneNumber || profile.phoneNumber;
    const updatedBankName = bankName || profile.bankName;
    const updatedAccountNumber = accountNumber || profile.accountNumber;
    const updatedAccountName = accountName || profile.accountName;
    const updatedSpecialization = specialization
      ? parseSpecialization(specialization)
      : profile.specialization;
    const updatedYearsOfExperience =
      yearsOfExperience || profile.yearsOfExperience;
    const updatedShortBio = shortBio || profile.shortBio;

    const isProfileCompleted =
      updatedBusinessName &&
      updatedCurrentHouseAddress &&
      updatedState &&
      updatedCountry &&
      updatedPhoneNumber &&
      updatedSpecialization &&
      updatedYearsOfExperience &&
      updatedShortBio &&
      profilePhoto;

    await profile.update({
      businessName: updatedBusinessName,
      currentHouseAddress: updatedCurrentHouseAddress,
      state: updatedState,
      country: updatedCountry,
      phoneNumber: updatedPhoneNumber,
      bankName: updatedBankName,
      accountNumber: updatedAccountNumber,
      accountName: updatedAccountName,
      specialization: updatedSpecialization,
      yearsOfExperience: updatedYearsOfExperience,
      shortBio: updatedShortBio,
      profilePhoto,
      isProfileCompleted: !!isProfileCompleted,
    });

   
    let wallet = await DesignerWallet.findOne({
      where: { designerId },
    });

    if (wallet) {
      await wallet.update({
        bankName: updatedBankName,
        accountNumber: updatedAccountNumber,
        accountName: updatedAccountName,
      });
    }

    res.status(200).json({
      success: true,
      message: "Your profile has been updated.",
      data: profile,
    });
  } catch (error) {
    next(error)
  }
};

exports.deleteDesignerProfile = async (req, res, next) => {
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
      message: "Profile deleted successfully.",
    });
  } catch (error) {
    next(error)
  }
};

exports.updateDesignerProfileSettings = async (req, res) => {
  try {
    const id = req.user.id;

    const foundProfile = await Designer.findOne({ where: { id } });
    if (!foundProfile) {
      return res.status(404).json({
        message: 'Designer not found'
      });
    }

    const { bio, email, firstName, lastName, location } = req.body;
    let profile = await DesignerProfile.findOne({
      where: { id }
    });
    let profilePhoto = profile ? profile.profilePhoto : null;

    if (req.file) {
      const filePath = req.file.path;
      const uploadToCloudinary = await cloudinary.uploader.upload(filePath);
      profilePhoto = uploadToCloudinary.secure_url;
      fs.unlinkSync(filePath);
    }

   
    if (!bio  || !email || !firstName || !lastName || !location ) {
      return res.status(error).json({
        message: 'All fields are required'
      });
    }

   
    await Designer.update(
      { email, firstName, lastName },
      { where: { id } }
    );

    
    const updatedProfileSetting = await DesignerProfile.update(
      { bio, profilePhoto, email, firstName, lastName, location },
      { where: { designerId: id } }
    );

    return res.status(200).json({
      message: 'Profile Updated Successfully',
      updatedProfileSetting
    });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: error.message
    });
  }
};
