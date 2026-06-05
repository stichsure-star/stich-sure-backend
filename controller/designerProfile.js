const {DesignerProfile} = require('../models');
const cloudinary = require('../utils/cloudinary');
const fs = require('fs');

exports.createDesignerProfile = async (req, res) => {
  try {
    const { designerId, businessName, currentHouseAddress, specialization, yearsOfExperience, shortBio } = req.body;
    
    let profilePhoto = null;

    if (req.file) {
      const filePath = req.file.path;
      const uploadToCloudinary = await cloudinary.uploader.upload(filePath);
      profilePhoto = uploadToCloudinary.secure_url;
      fs.unlinkSync(filePath);
    }

    const designerProfile = await DesignerProfile.create({
      designerId,
      businessName,
      currentHouseAddress,
      profilePhoto,
      specialization: JSON.parse(specialization),
      yearsOfExperience,
      shortBio
    });

    res.status(201).json({
      success: true,
      message: "Designer profile created successfully.",
      data: designerProfile,
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      message: "Something went wrong"
    })
  }
}

exports.getAllDesignerProfiles = async (req, res) => {
  try {
    const designerProfiles = await DesignerProfile.findAll();

    res.status(200).json({
      success: true,
      message: "Designer profiles loaded successfully.",
      data: designerProfiles,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
};

exports.getDesignerProfile = async (req, res) => {
  try {
    const { designerId } = req.params;

    const designerProfile = await DesignerProfile.findOne({
      where: { designerId }
    });

    if (!designerProfile) {
      return res.status(404).json({
        message: "Designer profile not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Designer profile loaded successfully.",
      data: designerProfile,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
};

exports.updateDesignerProfile = async (req, res) => {
  try {
    const  designerId = req.user.id;
    const { businessName, currentHouseAddress, specialization, yearsOfExperience, shortBio } = req.body;

    const designerProfile = await DesignerProfile.findOne({
      where: { designerId }
    });

    if (!designerProfile) {
      return res.status(404).json({
        message: "Designer profile not found"
      });
    }

    let profilePhoto = designerProfile.profilePhoto;

    if (req.file) {
      const filePath = req.file.path;
      const uploadToCloudinary = await cloudinary.uploader.upload(filePath);
      profilePhoto = uploadToCloudinary.secure_url;
      fs.unlinkSync(filePath);
    }

    await designerProfile.update({
      businessName: businessName || designerProfile.businessName,
      currentHouseAddress: currentHouseAddress || designerProfile.currentHouseAddress,
      profilePhoto,
      specialization: specialization ? JSON.parse(specialization) : designerProfile.specialization,
      yearsOfExperience: yearsOfExperience || designerProfile.yearsOfExperience,
      shortBio: shortBio || designerProfile.shortBio
    });

    res.status(200).json({
      success: true,
      message: "Designer profile updated successfully.",
      data: designerProfile,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
};

exports.deleteDesignerProfile = async (req, res) => {
  try {
    const { designerId } = req.params;

    const designerProfile = await DesignerProfile.findOne({
      where: { designerId }
    });

    if (!designerProfile) {
      return res.status(404).json({
        message: "Designer profile not found"
      });
    }

    await designerProfile.destroy();

    res.status(200).json({
      success: true,
      message: "Designer profile deleted successfully.",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
};
