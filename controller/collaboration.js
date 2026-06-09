const { Op } = require("sequelize");
const { Collaboration, Designer } = require("../models");

const designerAttributes = ["id", "firstName", "lastName", "email"];
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const collaborationInclude = [
  {
    model: Designer,
    as: "sender",
    attributes: designerAttributes,
  },
  {
    model: Designer,
    as: "receiver",
    attributes: designerAttributes,
  },
];

exports.createCollaboration = async (req, res) => {
  try {
    const senderDesignerId = req.user.id;
    const {
      receiverDesignerId,
      title,
      description,
      specialtyNeeded,
      deadline,
      priceOffer,
    } = req.body;

    if (senderDesignerId === receiverDesignerId) {
      return res.status(400).json({
        message: "You cannot send a collaboration request to yourself",
      });
    }

    const receiver = await Designer.findByPk(receiverDesignerId);

    if (!receiver) {
      return res.status(404).json({
        message: "Receiver designer not found",
      });
    }

    const collaboration = await Collaboration.create({
      senderDesignerId,
      receiverDesignerId,
      title,
      description,
      specialtyNeeded,
      deadline,
      priceOffer,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Collaboration request sent successfully.",
      data: collaboration,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.getSentCollaborations = async (req, res) => {
  try {
    const collaborations = await Collaboration.findAll({
      where: { senderDesignerId: req.user.id },
      include: collaborationInclude,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Sent collaborations loaded successfully.",
      data: collaborations,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.getReceivedCollaborations = async (req, res) => {
  try {
    const collaborations = await Collaboration.findAll({
      where: { receiverDesignerId: req.user.id },
      include: collaborationInclude,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Received collaborations loaded successfully.",
      data: collaborations,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.getOneCollaboration = async (req, res) => {
  try {
    const { id } = req.params;

    const collaboration = await Collaboration.findOne({
      where: {
        id,
        [Op.or]: [
          { senderDesignerId: req.user.id },
          { receiverDesignerId: req.user.id },
        ],
      },
      include: collaborationInclude,
    });

    if (!collaboration) {
      return res.status(404).json({
        message: "Collaboration not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Collaboration loaded successfully.",
      data: collaboration,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.acceptCollaboration = async (req, res) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({
        message: "Invalid collaboration id",
      });
    }

    const collaboration = await Collaboration.findByPk(id);

    if (!collaboration) {
      return res.status(404).json({
        message:
          "Collaboration not found. Use the collaboration id from /api/v1/collaboration/received, not the designer id.",
      });
    }

    if (collaboration.receiverDesignerId !== req.user.id) {
      return res.status(403).json({
        message: "Only the receiving designer can accept this request",
      });
    }

    if (collaboration.status !== "pending") {
      return res.status(400).json({
        message: "Only pending collaborations can be accepted",
      });
    }

    await collaboration.update({ status: "accepted" });

    return res.status(200).json({
      success: true,
      message: "Collaboration accepted successfully.",
      data: collaboration,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.rejectCollaboration = async (req, res) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({
        message: "Invalid collaboration id",
      });
    }

    const collaboration = await Collaboration.findByPk(id);

    if (!collaboration) {
      return res.status(404).json({
        message:
          "Collaboration not found. Use the collaboration id from /api/v1/collaboration/received, not the designer id.",
      });
    }

    if (collaboration.receiverDesignerId !== req.user.id) {
      return res.status(403).json({
        message: "Only the receiving designer can reject this request",
      });
    }

    if (collaboration.status !== "pending") {
      return res.status(400).json({
        message: "Only pending collaborations can be rejected",
      });
    }

    await collaboration.update({ status: "rejected" });

    return res.status(200).json({
      success: true,
      message: "Collaboration rejected successfully.",
      data: collaboration,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.completeCollaboration = async (req, res) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({
        message: "Invalid collaboration id",
      });
    }

    const collaboration = await Collaboration.findByPk(id);

    if (!collaboration) {
      return res.status(404).json({
        message:
          "Collaboration not found. Use the collaboration id from /api/v1/collaboration/sent or /api/v1/collaboration/received.",
      });
    }

    if (
      collaboration.senderDesignerId !== req.user.id &&
      collaboration.receiverDesignerId !== req.user.id
    ) {
      return res.status(403).json({
        message: "You are not part of this collaboration",
      });
    }

    if (collaboration.status !== "accepted") {
      return res.status(400).json({
        message: "Only accepted collaborations can be completed",
      });
    }

    await collaboration.update({ status: "completed" });

    return res.status(200).json({
      success: true,
      message: "Collaboration completed successfully.",
      data: collaboration,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.cancelCollaboration = async (req, res) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({
        message: "Invalid collaboration id",
      });
    }

    const collaboration = await Collaboration.findByPk(id);

    if (!collaboration) {
      return res.status(404).json({
        message:
          "Collaboration not found. Use the collaboration id from /api/v1/collaboration/sent, not the designer id.",
      });
    }

    if (collaboration.senderDesignerId !== req.user.id) {
      return res.status(403).json({
        message: "Only the sending designer can cancel this request",
      });
    }

    if (!["pending", "accepted"].includes(collaboration.status)) {
      return res.status(400).json({
        message: "This collaboration cannot be cancelled",
      });
    }

    await collaboration.update({ status: "cancelled" });

    return res.status(200).json({
      success: true,
      message: "Collaboration cancelled successfully.",
      data: collaboration,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.getCollaborationStats = async (req, res) => {
  try {
    const designerId = req.user.id;
    const designerWhere = {
      [Op.or]: [
        { senderDesignerId: designerId },
        { receiverDesignerId: designerId },
      ],
    };

    const activeCollaborations = await Collaboration.count({
      where: {
        ...designerWhere,
        status: "accepted",
      },
    });

    const tasksCompleted = await Collaboration.count({
      where: {
        ...designerWhere,
        status: "completed",
      },
    });

    const totalFinished = await Collaboration.count({
      where: {
        ...designerWhere,
        status: {
          [Op.in]: ["completed", "rejected", "cancelled"],
        },
      },
    });

    const partners = await Collaboration.findAll({
      where: designerWhere,
      attributes: ["senderDesignerId", "receiverDesignerId"],
    });

    const partnerIds = new Set();
    partners.forEach((collaboration) => {
      if (collaboration.senderDesignerId !== designerId) {
        partnerIds.add(collaboration.senderDesignerId);
      }
      if (collaboration.receiverDesignerId !== designerId) {
        partnerIds.add(collaboration.receiverDesignerId);
      }
    });

    const successRate =
      totalFinished === 0
        ? 0
        : Math.round((tasksCompleted / totalFinished) * 100);

    return res.status(200).json({
      success: true,
      message: "Collaboration stats loaded successfully.",
      data: {
        activeCollaborations,
        trustedPartners: partnerIds.size,
        tasksCompleted,
        successRate,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};
