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

exports.createOrUpdateDesignerProfile = async (req, res, next) => {
  try {
    const designerId = req.user.id;

    const {
      businessName,
      currentHouseAddress,
      phoneNumber,
      bankName,
      accountNumber,
      accountName,
      specialization,
      yearsOfExperience,
      shortBio,
    } = req.body;
    const parsedSpecialization = parseSpecialization(specialization);

    if (!businessName || !currentHouseAddress || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Business name, current house address, and phone number are required.",
      });
    }

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
      phoneNumber &&
      parsedSpecialization &&
      yearsOfExperience &&
      shortBio &&
      profilePhoto;

    if (profile) {
      await profile.update({
        businessName,
        currentHouseAddress,
        phoneNumber,
        bankName,
        accountNumber,
        accountName,
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
        phoneNumber,
        bankName,
        accountNumber,
        accountName,
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

exports.createOrUpdateDesignerOnboarding = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const designerId = req.user.id;
    const {
      businessName,
      currentHouseAddress,
      phoneNumber,
      specialization,
      yearsOfExperience,
      shortBio,
      bankName,
      accountNumber,
      accountName,
    } = req.body;

    if (!businessName || !currentHouseAddress || !phoneNumber) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Business name, current house address, and phone number are required.",
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
      phoneNumber &&
      parsedSpecialization &&
      yearsOfExperience &&
      shortBio &&
      profilePhoto;

    const profilePayload = {
      designerId,
      businessName,
      currentHouseAddress,
      phoneNumber,
      bankName,
      accountNumber,
      accountName,
      specialization: parsedSpecialization,
      yearsOfExperience,
      shortBio,
      profilePhoto,
      isProfileCompleted: !!isProfileCompleted,
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
      message: "Designer onboarding saved successfully.",
      data: {
        profile,
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

exports.getDesignerDashboardStats = async (req, res, next) => {
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

exports.updateDesignerProfile = async (req, res, next) => {
  try {
    const designerId = req.user.id;
    const {
      businessName,
      currentHouseAddress,
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
      updatedPhoneNumber &&
      updatedSpecialization &&
      updatedYearsOfExperience &&
      updatedShortBio &&
      profilePhoto;

    await profile.update({
      businessName: updatedBusinessName,
      currentHouseAddress: updatedCurrentHouseAddress,
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

    res.status(200).json({
      success: true,
      message: "Designer profile updated successfully.",
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
      message: "Designer profile deleted successfully.",
    });
  } catch (error) {
    next(error)
  }
};
