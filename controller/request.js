const { Op } = require("sequelize");
const { request, DesignerProfile } = require("../models");

const updateDesignerStats = async (designerId) => {
  const profile = await DesignerProfile.findOne({
    where: { designerId },
  });

  if (!profile) {
    return;
  }

  const completedOrders = await request.count({
    where: {
      designerId,
      status: "completed",
    },
  });

  const totalAcceptedJobs = await request.count({
    where: {
      designerId,
      status: {
        [Op.in]: ["accepted", "completed"],
      },
    },
  });

  const reliabilityScore =
    totalAcceptedJobs === 0
      ? 0
      : Math.round((completedOrders / totalAcceptedJobs) * 100);

  await profile.update({
    completedOrders,
    reliabilityScore,
  });
};

exports.createRequest = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { designerId, fullName, deadLine, measurement, description } = req.body;

    const newRequest = await request.create({
      customerId,
      designerId,
      fullName,
      deadLine,
      measurement,
      description,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Your request has been created successfully.",
      data: newRequest,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.sendOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const { priceOffer, designerMessage } = req.body;

    const foundRequest = await request.findByPk(id);

    if (!foundRequest) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (foundRequest.status !== "pending") {
      return res.status(400).json({
        message: "You can only send an offer for a pending request",
      });
    }

    await foundRequest.update({
      priceOffer,
      designerMessage,
      status: "proposal_sent",
    });

    return res.status(200).json({
      success: true,
      message: "The offer has been sent successfully.",
      data: foundRequest,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const foundRequest = await request.findByPk(id);

    if (!foundRequest) {
      return res.status(404).json({
        message: "Request not found"
      })
    }

    if (foundRequest.status !== "proposal_sent") {
      return res.status(400).json({
        message: "Only requests with an offer can be accepted",
      });
    }

    await foundRequest.update({
      status: "accepted",
    });

    return res.status(200).json({
      success: true,
      message: "The request has been accepted successfully.",
      data: foundRequest,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong"
    })
  }
}

exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const foundRequest = await request.findByPk(id);

    if (!foundRequest) {
      return res.status(404).json({
         message: "Request not found"
      });
    }

    if (foundRequest.status !== "proposal_sent") {
      return res.status(400).json({
        message: "Only requests with an offer can be rejected",
      });
    }

    await foundRequest.update({
      status: "rejected",
    });

    return res.status(200).json({
      success: true,
      message: "The request has been rejected successfully.",
      data: foundRequest,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
       message: "Something went wrong"
    });
  }
};

exports.completeRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const foundRequest = await request.findByPk(id);

    if (!foundRequest) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (foundRequest.status !== "accepted") {
      return res.status(400).json({
        message: "Only accepted requests can be completed",
      });
    }

    await foundRequest.update({
      status: "completed",
    });

    await updateDesignerStats(foundRequest.designerId);

    return res.status(200).json({
      success: true,
      message: "The request has been marked as completed successfully.",
      data: foundRequest,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.rateDesigner = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const ratingValue = Number(rating);

    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const foundRequest = await request.findByPk(id);

    if (!foundRequest) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (foundRequest.status !== "completed") {
      return res.status(400).json({
        message: "You can only rate completed requests",
      });
    }

    const profile = await DesignerProfile.findOne({
      where: { designerId: foundRequest.designerId },
    });

    if (!profile) {
      return res.status(404).json({
        message: "Designer profile not found",
      });
    }

    const oldAverage = Number(profile.ratingAverage);
    const oldCount = profile.ratingCount;
    const newAverage =
      (oldAverage * oldCount + ratingValue) / (oldCount + 1);

    await profile.update({
      ratingAverage: newAverage.toFixed(2),
      ratingCount: oldCount + 1,
    });

    return res.status(200).json({
      success: true,
      message: "The designer has been rated successfully.",
      data: profile,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};
