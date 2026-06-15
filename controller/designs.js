const { Designs } = require("../models");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const { AppError } = require('../utils/errorHandler');


exports.createDesign = async (req, res, next) => {
  try {
    const { designerId, designTitle, category, price, description, measurement } = req.body;
    let designImage = null;

    if (req.file) {
      const filePath = req.file.path;
      const uploadToCloudinary = await cloudinary.uploader.upload(filePath);
      designImage = uploadToCloudinary.secure_url;
      fs.unlinkSync(filePath);
    }

    const newDesign = await Designs.create({
      designerId: designerId,
      designTitle: designTitle,
      category: category,
      price: price,
      description: description,
      designImage: designImage,
      measurement: measurement
    });

    return res.status(201).json({
      success: true,
      message: "New design has been created successfully.",
      data: newDesign,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllDesigns = async (req, res, next) => {
  try {
    const designs = await Designs.findAll();

    return res.status(200).json({
      success: true,
      message: "All designs have been loaded successfully.",
      data: designs,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDesignById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const design = await Designs.findByPk(id);

    if (!design) {
      return res.status(404).json({
        message: "Design not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Design details have been retrieved successfully.",
      data: design,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDesignerDesigns = async (req, res, next) => {
  try {
    const { designerId } = req.params;
    const designs = await Designs.findAll({where: {designerId: designerId}});

    return res.status(200).json({
      success: true,
      message: "Designs for the requested designer have been loaded successfully.",
      data: designs,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDesign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { designTitle, category, price, description } = req.body;
    const design = await Designs.findByPk(id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: "Design not found",
      });
    }

    let designImage = design.designImage;

    if (req.file) {
      const filePath = req.file.path;
      const uploadToCloudinary = await cloudinary.uploader.upload(filePath);
      designImage = uploadToCloudinary.secure_url;
      fs.unlinkSync(filePath);
    }

    await design.update({
      designTitle: designTitle || design.designTitle,
      category: category || design.category,
      price: price || design.price,
      description: description || design.description,
      designImage: designImage,
    });

    return res.status(200).json({
      success: true,
      message: "The design has been updated successfully.",
      data: design,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDesign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const design = await Designs.findByPk(id);

    if (!design) {
      return res.status(404).json({
        message: "Design not found",
      });
    }

    await design.destroy();

    return res.status(200).json({
      success: true,
      message: "The design has been deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
