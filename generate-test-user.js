const { Designer } = require('./models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

(async () => {
    try {
        const testEmail = `test_designer_${Date.now()}@example.com`;
        const testPassword = "Password123!";

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(testPassword, salt);

        const newDesigner = await Designer.create({
            firstName: "Flutter",
            lastName: "Tester",
            email: testEmail,
            password: hashPassword,
            otp: null,
            otpExpire: null,
            role: "designer",
            isEmailVerified: true // Automatically skip OTP for our test!
        });

        const token = jwt.sign(
            {
                id: newDesigner.id,
                email: newDesigner.email,
                role: newDesigner.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Output the token with a tag so bash can grep it easily past the noise
        console.log("###TOKEN###" + token);
        process.exit(0);
    } catch (e) {
        console.error("Failed to generate test user:", e.message);
        process.exit(1);
    }
})();
