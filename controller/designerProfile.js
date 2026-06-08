const { Designer, DesignerProfile, Designs } = require("../models");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

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
          model: Designs,
          as: "designs",
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "All designer profiles have been loaded successfully.",
      data: designers,
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

    res.status(200).json({
      success: true,
      message: "Designer profile has been loaded successfully.",
      data: designer,
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
