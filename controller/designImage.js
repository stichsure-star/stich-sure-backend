const {designImage} = require('../models')
const cloudinary = require("../middlewares/cloudinary");
const fs = require("fs")

exports.createDesignImage = async (req, res, next) => {
  try {
    const { designerId, image } = req.body;
    let imagesPaths = []


  for (const path of imagesPaths) {
            const result = await cloudinary.uploader.upload(path)
            console.log('results: ',result);
            
            imagesPaths.push(result.secure_url);
            fs.unlinkSync(path)
        }

    const newImage = await designImage.create({
      designerId: designerId,
      image: imagesPaths,
    });
    return res.status(201).json({
      message: "Design image created successfully",
      data: newImage,
    });
  } catch (error) {
    next(error);
  }
};
exports.getAllDesignImages = async (req, res, next) => {
  try {

    const images = await designImage.findAll();
    if (!images) {
      return res.status(404).json({
        message: "No design images found",
      });
    }

    return res.status(200).json({
        message: "Design images retrieved successfully",
      data: images,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOneDesignImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const image = await designImage.findByPk(id);

    if (!image) {
      return res.status(404).json({
        message: "Design image not found",
      });
    }

    return res.status(200).json({
      message: "Design image retrieved successfully",
      data: image,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllDesignerImages = async (req, res, next) => {
  try {
    const { designerId } = req.params;
    const images = await designImage.findAll({
      where: {
        designerId: designerId,
      },
    });

    return res.status(200).json({
      message: "Designer images retrieved successfully",
      data: images,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDesignImage = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {image} = req.body;
    const findimage = await designImage.findByPk(id);
      if (req.file) {
            // Check if the Old Files exists
            findimage.image.forEach(element => {
                const oldImagePath = fs.existsSync(element);
                if (oldImagePath) {
                    fs.unlinkSync(element)
                }
            });

            updatedDesignImage.image = req.files.map((img) => img.path)
        }
    if (!updatedDesignImage) {
      return res.status(404).json({
        message: "Design image not found",
      });
    }

    const updatedDesignImage = await designImage.update({ image }, { where: { id: id } });

    return res.status(200).json({
      message: "Design image updated successfully",
      data: updatedDesignImage,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDesignImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const DesignImage = await designImage.findByPk(id);

    if (!DesignImage) {
      return res.status(404).json({
        success: false,
        message: "Design image not found",
      });
    }

    const deletedDesignImage = await designImage.destroy({ where: { id: id } });

    return res.status(200).json({
      message: "Design image deleted successfully",
      data: deletedDesignImage,
    });
  } catch (error) {
    next(error);
  }
};