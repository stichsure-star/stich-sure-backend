const { DesignerWallet } = require('./models');
const jwt = require('jsonwebtoken');

(async () => {
    try {
        const token = process.argv[2];
        if (!token) {
            console.log("Error: No token provided.");
            process.exit(1);
        }

        const decoded = jwt.decode(token);
        if (!decoded || !decoded.id) {
            console.log("Error: Invalid token.");
            process.exit(1);
        }

        const wallet = await DesignerWallet.findOne({ where: { designerId: decoded.id } });

        if (!wallet) {
            console.log("Error: Wallet not found in DB.");
            process.exit(1);
        }

        // Add 5000 NGN to the available balance for testing
        await wallet.update({ availableBalance: Number(wallet.availableBalance || 0) + 5000 });

        console.log("Success: Wallet has been successfully funded with 5000 NGN for testing withdrawal!");
        process.exit(0);
    } catch (e) {
        console.error("Database connection error or issue:", e.message);
        process.exit(1);
    }
})();
