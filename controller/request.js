const { Op } = require("sequelize");
const { request, DesignerProfile, Customer, Designer } = require("../models");
const { AppError } = require('../utils/errorHandler');

const progressByStatus = {
  pending: 0,
  proposal_sent: 0,
  accepted: 0,
  picked_up: 33,
  ready: 66,
  completed: 100,
};

const buildTrackingSteps = (foundRequest) => [
  {
    key: "picked_up",
    label: "Picked Up",
    completed: !!foundRequest.pickedUpAt,
    completedAt: foundRequest.pickedUpAt,
  },
  {
    key: "ready",
    label: "Ready",
    completed: !!foundRequest.readyAt,
    completedAt: foundRequest.readyAt,
  },
  {
    key: "completed",
    label: "Delivered",
    completed: !!foundRequest.completedAt,
    completedAt: foundRequest.completedAt,
  },
];

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
        [Op.in]: ["accepted", "picked_up", "ready", "completed"],
      },
    },
  });

  const reliabilityScore =
    totalAcceptedJobs === 0
      ? 100
      : Math.round((completedOrders / totalAcceptedJobs) * 100);

  await profile.update({
    completedOrders,
    reliabilityScore,
  });
};

exports.createRequest = async (req, res, next) => {
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
      message: "Your request has been sent to the designer!",
      data: newRequest,
    });
  } catch (error) {
    next(error)
  }
};

exports.getAllRequests = async (req, res, next) => {
  try {
    const requests = await request.findAll({
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Designer,
          as: "designer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "List of requests retrieved.",
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOneRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const foundRequest = await request.findByPk(id, {
      include: [
        { model: Customer, as: "customer", attributes: ["id", "firstName", "lastName", "email"] },
        { model: Designer, as: "designer", attributes: ["id", "firstName", "lastName", "email"] },
      ],
    });

    if (!foundRequest) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Request details retrieved.",
      data: foundRequest,
    });
  } catch (error) {
    next(error);
  }
};

exports.sendOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { designerMessage } = req.body;

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
      designerMessage,
      status: "proposal_sent",
      progress: progressByStatus.proposal_sent,
      offerSentAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Your offer has been sent to the customer.",
      data: foundRequest,
    });
  } catch (error) {
    next(error)
  }
};

exports.acceptRequest = async (req, res, next) => {
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
      progress: progressByStatus.accepted,
    });

    return res.status(200).json({
      success: true,
      message: "Request accepted!",
      data: foundRequest,
    });
  } catch (error) {
    next(error)
  }
}

exports.rejectRequest = async (req, res, next) => {
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
      message: "The request has been declined.",
      data: foundRequest,
    });
  } catch (error) {
    next(error)
  }
};

exports.completeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const foundRequest = await request.findByPk(id);

    if (!foundRequest) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (!["accepted", "picked_up", "ready"].includes(foundRequest.status)) {
      return res.status(400).json({
        message: "Only active requests can be completed",
      });
    }

    await foundRequest.update({
      status: "completed",
      progress: progressByStatus.completed,
      completedAt: foundRequest.completedAt || new Date(),
    });

    await updateDesignerStats(foundRequest.designerId);

    return res.status(200).json({
      success: true,
      message: "Project marked as delivered and complete.",
      data: {
        ...foundRequest.toJSON(),
        trackingSteps: buildTrackingSteps(foundRequest),
      },
    });
  } catch (error) {
    next(error)
  }
};

exports.updateRequestProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestedStatus = req.body.status;
    const nextStatus = requestedStatus === "delivered" ? "completed" : requestedStatus;

    const allowedSteps = ["picked_up", "ready", "completed"];
    const previousStatus = {
      picked_up: "accepted",
      ready: "picked_up",
      completed: "ready",
    };

    if (!allowedSteps.includes(nextStatus)) {
      return res.status(400).json({
        message: "Status must be picked_up, ready, or delivered",
      });
    }

    const foundRequest = await request.findByPk(id);

    if (!foundRequest) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (foundRequest.designerId !== req.user.id) {
      return res.status(403).json({
        message: "Only the assigned designer can update this request progress",
      });
    }

    if (foundRequest.status !== previousStatus[nextStatus]) {
      return res.status(400).json({
        message: `You can only mark this request as ${nextStatus} after ${previousStatus[nextStatus]}`,
      });
    }

    const updateData = {
      status: nextStatus,
      progress: progressByStatus[nextStatus],
    };

    if (nextStatus === "picked_up") {
      updateData.pickedUpAt = new Date();
    }

    if (nextStatus === "ready") {
      updateData.readyAt = new Date();
    }

    if (nextStatus === "completed") {
      updateData.completedAt = new Date();
    }

    await foundRequest.update(updateData);

    if (nextStatus === "completed") {
      await updateDesignerStats(foundRequest.designerId);
    }

    await foundRequest.reload();

    return res.status(200).json({
      success: true,
      message: "Order progress updated.",
      data: {
        ...foundRequest.toJSON(),
        trackingSteps: buildTrackingSteps(foundRequest),
      },
    });
  } catch (error) {
    next(error)
  }
};

exports.getRequestTracking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const foundRequest = await request.findByPk(id);

    if (!foundRequest) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tracking information retrieved.",
      data: {
        ...foundRequest.toJSON(),
        trackingSteps: buildTrackingSteps(foundRequest),
      },
    });
  } catch (error) {
    next(error)
  }
};

exports.rateDesigner = async (req, res, next) => {
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
      message: "Thank you for your feedback! The designer has been rated.",
      data: profile,
    });
  } catch (error) {
    next(error)
  }
};