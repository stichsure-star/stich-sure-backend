const { Designer, DesignerProfile, DesignerWallet, Designs, request } = require("../models");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

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

exports.createOrUpdateDesignerProfile = async (req, res) => {
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
    console.log(error.message);
    res.status(500).json({
       message: "Something went wrong"
    });
  }
};

exports.getAllDesignerProfiles = async (req, res) => {
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
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.getDesignerProfile = async (req, res) => {
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
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.getDesignerDashboardStats = async (req, res) => {
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
        ? 100
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
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.updateDesignerProfile = async (req, res) => {
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
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.deleteDesignerProfile = async (req, res) => {
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
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.createDesignerWallet = async (req, res) => {
  try {
    const designerId = req.user.id;
    const { bankName, accountNumber, accountName } = req.body;

    const existingWallet = await DesignerWallet.findOne({
      where: { designerId },
    });

    if (existingWallet) {
      return res.status(400).json({
        success: false,
        message: "A wallet already exists for this designer. Use update instead.",
      });
    }

    const wallet = await DesignerWallet.create({
      designerId,
      bankName,
      accountNumber,
      accountName,
      totalEarnings: 0,
      availableBalance: 0,
      withdrawn: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Designer wallet created successfully.",
      data: wallet,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.updateDesignerWallet = async (req, res) => {
  try {
    const designerId = req.user.id;
    const { bankName, accountNumber, accountName } = req.body;

    const wallet = await DesignerWallet.findOne({
      where: { designerId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Designer wallet not found",
      });
    }

    await wallet.update({
      bankName: bankName || wallet.bankName,
      accountNumber: accountNumber || wallet.accountNumber,
      accountName: accountName || wallet.accountName,
    });

    return res.status(200).json({
      success: true,
      message: "Designer wallet updated successfully.",
      data: wallet,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.getDesignerWallet = async (req, res) => {
  try {
    const designerId = req.user.id;

    const wallet = await DesignerWallet.findOne({
      where: { designerId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Designer wallet not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Designer wallet loaded successfully.",
      data: wallet,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};
