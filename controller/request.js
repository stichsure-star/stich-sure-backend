const { request} = require('../models/request')


exports.createRequest = async (req, res) => {
  try {
    const { customerId, designerId, fullName, deadLine, description, measurement } = req.body;

    const newRequest = await request.create({

      customerId: customerId,
      designerId: designerId,
      fullName: fullName,
      deadLine: deadLine,
      description: description,
      measurement: measurement,
      status: "pending",

    });

    return res.status(201).json({
      success: true,
      message: "Request created successfully",
      data: newRequest,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await request.findAll();

    return res.status(200).json({
      message: "Requests retrieved successfully",
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOneRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const foundRequest = await request.findByPk(id);

    if (!foundRequest) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    return res.status(200).json({
      message: "Request retrieved successfully",
      data: foundRequest,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerRequests = async (req, res, ) => {
  try {
    const { customerId } = req.params;
    const requests = await request.findAll({
      where: {
        customerId: customerId,
      },
    });

    return res.status(200).json({
      message: "Customer requests retrieved successfully",
      data: requests,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
};

exports.getDesignerRequests = async (req, res, next) => {
  try {
    const { designerId } = req.params;  
    const requests = await request.findAll({
      where: {
        designerId: designerId,
      },
    });

    return res.status(200).json({
      message: "Designer requests retrieved successfully",
      data: requests,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
};

exports.updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateRequest = await request.findByPk(id);

    if (!updateRequest) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    await updateRequest.update({
      description: req.body.description,
      measurement: req.body.measurement,
      fullName: req.body.fullName
    }, { where: { id: id } });

    return res.status(200).json({
      message: "Request updated successfully",
      data: updateRequest,
    });
  } catch (error) {
    next(error);
  }
};


exports.deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedRequest = await request.findByPk(id);

    if (!deletedRequest) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    await deletedRequest.destroy({ where: { id: id } });

    return res.status(200).json({
      message: "Request deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};