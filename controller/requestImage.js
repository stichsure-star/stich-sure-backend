const { requestImage } = require("../models");
const cloudinary = require("../middlewares/cloudinary")

exports.createRequestImage = async (req, res, next) => {
  try {
    const { requestId, image } = req.body;
    let imagesPaths = [];
      for (const path of imagesPaths) {
                const result = await cloudinary.uploader.upload(path)
                console.log('results: ',result);
                
                imagesPaths.push(result.secure_url);
                fs.unlinkSync(path)
            }
    const newImage = await requestImage.create({
      requestId: requestId,
      image: imagesPaths,
    });

    return res.status(201).json({
      message: "Request image created successfully",
      data: newImage,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRequestImages = async (req, res, next) => {
  try {

    const images = await requestImage.findAll();

    return res.status(200).json({
        message: 'All request images retrieved successfully',
      data: images,
    });
  } catch (error) {
    next(error);
  }
};

exports.getImagesByRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const images = await requestImage.findAll({
      where: {
        requestId: requestId,
      },
    });

    return res.status(200).json({
      message: 'Request images retrieved successfully',
      data: images,
    });
  } catch (error) {
    next(error);
  }
};
exports.updateRequestImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { image } = req.body;
    const RequestImage = await requestImage.findByPk(id);
    if (req.file) {
                // Check if the Old Files exists
                RequestImage.image.forEach(element => {
                    const oldImagePath = fs.existsSync(element);
                    if (oldImagePath) {
                        fs.unlinkSync(element)
                    }
                });
            }
    if (!updatedRequestImage) {
      return res.status(404).json({
        message: "Request image not found",
      });
    }

    const updatedRequestImage = await requestImage.update({ image: image }, { where: { id: id } });

    return res.status(200).json({
      message: "Request image updated successfully",
      data: updatedRequestImage,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteRequestImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const image = await requestImage.findByPk(id);

    if (!image) {
      return res.status(404).json({
        message: "Request image not found",
      });
    }
    if (req.file) {
            //  Check if the old file exists
            const oldImageExists = fs.existsSync(image);
            if (oldImageExists) {
                // Delete the old file and update the new file into the product object
                newImage.image = req.file.path;
                fs.unlinkSync(image)
            }
        }
    const deletedRequestImage = await requestImage.destroy({ where: { id: id } });

    return res.status(200).json({
      message: "Request image deleted successfully",
      data: deletedRequestImage,
    });
  } catch (error) {
    next(error);
  }
};