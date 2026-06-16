const { Designs, Designer, DesignerProfile } = require("../models");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const { AppError } = require('../utils/errorHandler');


exports.createDesign = async (req, res, next) => {
  try {
    const { designerId, designTitle, category, price, description } = req.body;
    let { measurement } = req.body;
    let designImage = null;

    if (typeof measurement === "string" && measurement.trim().length > 0) {
      try {
        measurement = JSON.parse(measurement);
      } catch (err) {
        // keep string values for backward compatibility; validation will reject incorrect formats
      }
    }

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
    const designs = await Designs.findAll({
      include: [
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName"],
          include: [
            {
              model: DesignerProfile,
              as: "profile",
              attributes: ["businessName"],
            },
          ],
        },
      ],
    });

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
    const design = await Designs.findByPk(id, {
      include: [
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName"],
          include: [
            {
              model: DesignerProfile,
              as: "profile",
              attributes: ["businessName"],
            },
          ],
        },
      ],
    });

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
    const designs = await Designs.findAll({
      where: { designerId: designerId },
      include: [
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName"],
          include: [
            {
              model: DesignerProfile,
              as: "profile",
              attributes: ["businessName"],
            },
          ],
        },
      ],
    });

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
    let { measurement } = req.body;
    const design = await Designs.findByPk(id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: "Design not found",
      });
    }

    if (typeof measurement === "string" && measurement.trim().length > 0) {
      try {
        measurement = JSON.parse(measurement);
      } catch (err) {
        // keep string values for backward compatibility; validation will reject incorrect formats
      }
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
      measurement: measurement !== undefined ? measurement : design.measurement,
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
