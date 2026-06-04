const { Designs } = require("../models");


exports.createDesign = async (req, res, next) => {
  try {
    const { designerId, title, category, price, description } = req.body;

    const newDesign = await Designs.create({
      designerId: designerId,
      title: title,
      category: category,
      price: price,
      description: description,
    });

    return res.status(201).json({
      success: true,
      message: "Design created successfully",
      data: newDesign,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllDesigns = async (req, res, next) => {
  try {
    const designs = await Designs.findAll()

    return res.status(200).json({
        message: 'All designs retrieved successfully',
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
      message: 'Design retrieved successfully',
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
      message: 'Designer designs retrieved successfully',
      data: designs,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDesign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, price, description } = req.body;
    const design = await Designs.findByPk(id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: "Design not found",
      });
    }

    const updatedDesign = await Designs.update({
      title: title,
      category: category,
      price: price,
      description: description,
    }, { where: { id: id }});

    return res.status(200).json({
      message: "Design updated successfully",
      data: updatedDesign,
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

    const deletedDesign = await Designs.destroy({ where: { id: id } });

    return res.status(200).json({
      success: true,
      message: "Design deleted successfully",
      data: deletedDesign,
    });
  } catch (error) {
    next(error);
  }
};