const { DesignerWallet } = require("../models");

exports.createDesignerWallet = async (req, res) => {
  try {
    const designerId = req.user.id;
    const { bankName, accountNumber, accountName } = req.body;

    const existingWallet = await DesignerWallet.findOne({
      where: { designerId },
    });

    if (existingWallet) {
      return res.status(400).json({
        success: false,
        message: "A wallet already exists for this designer. Use update instead.",
      });
    }

    const wallet = await DesignerWallet.create({
      designerId,
      bankName,
      accountNumber,
      accountName,
      totalEarnings: 0,
      availableBalance: 0,
      withdrawn: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Designer wallet created successfully.",
      data: wallet,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.updateDesignerWallet = async (req, res) => {
  try {
    const designerId = req.user.id;
    const { bankName, accountNumber, accountName } = req.body;

    const wallet = await DesignerWallet.findOne({
      where: { designerId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Designer wallet not found",
      });
    }

    await wallet.update({
      bankName: bankName || wallet.bankName,
      accountNumber: accountNumber || wallet.accountNumber,
      accountName: accountName || wallet.accountName,
    });

    return res.status(200).json({
      success: true,
      message: "Designer wallet updated successfully.",
      data: wallet,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

exports.getDesignerWallet = async (req, res) => {
  try {
    const designerId = req.user.id;

    const wallet = await DesignerWallet.findOne({
      where: { designerId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Designer wallet not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Designer wallet loaded successfully.",
      data: wallet,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};
