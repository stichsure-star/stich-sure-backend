exports.emailTemplate = (name, otp)=>{
return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>your otp?</title>
<body>
    <div class="main-section">
        <div class="upper-div">
            <div class="upper-div-1">
                <h1>Email OTP Verification</h1>
                <h3>Hello, ${name}</h3>
                <p>Below is your one time passcode that you need to use to complete your authentication. The verification code will be valid for 3 minutes. Please do not share this code with anyone.</p>
            </div>
            <div class="upper-div-2">
                <h2> ${otp} </h2>
            </div>
            <div class="upper-div-3">
                <p>If you are having any issues with your account, please don't hesitate to contact us.</p>
            </div>
        </div>
        <div class="downer-div">
            <p>If you would like to know more about our services, please also refer to Helpcenter</p>
            <p>Stich Sure Team</p>
        </div>
    </div>
</body>
</html>`
}



exports.resetPasswordTemplate = (name, otp)=> {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Stich Sure Password</title>
    <style>
        /* Mobile Styles */
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0px !important; }
            .otp-code { font-size: 32px !important; letter-spacing: 6px !important; }
            .content { padding: 30px 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <center>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f6;">
            <tr>
                <td align="center" style="padding: 40px 10px;">
                    <!-- Main Card -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="container" style="width: 100%; max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
                        
                        <!-- Brand Header -->
                        <tr>
                            <td align="center" style="padding: 30px 20px; background-color: #ffffff; border-bottom: 1px solid #eeeeee;">
                                <h1 style="margin: 0; color: #ddad0f; font-size: 24px; font-weight: 800; letter-spacing: 1px;">HedgeNest</h1>
                            </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                            <td class="content" style="padding: 40px; text-align: center; color: #333333;">
                                <h2 style="margin: 0 0 15px; font-size: 22px; font-weight: 700; color: #1a1a1a;">Password Reset</h2>
                                <p style="font-size: 16px; line-height: 1.5; margin: 0 0 25px; color: #666666;">
                                    Hi ${name}, we received a request to reset your password. Use the code below to proceed:
                                </p>
                                
                                <!-- OTP Box -->
                                <div style="background-color: #f8fafc; border: 2px dashed #bebb11; border-radius: 12px; padding: 25px; margin: 20px 0;">
                                    <span class="otp-code" style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: bold; letter-spacing: 10px; color: #1a1a1a; display: block;">
                                        ${otp}
                                    </span>
                                </div>

                                <p style="font-size: 14px; color: #999999; margin-top: 25px; line-height: 1.4;">
                                    This code is valid for <strong>7 minutes</strong>. <br>
                                    If you didn't request this, please ignore this email or contact support if you're concerned about your account security.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 25px; background-color: #fafafa; font-size: 12px; color: #aaaaaa;">
                                <p style="margin: 0;">&copy; 2026 HedgeNest App. All rights reserved.</p>
                                <p style="margin: 8px 0 0;">
                                    <a href="#" style="color: #111111; text-decoration: none;">Help Center</a> • 
                                    <a href="#" style="color: #090908; text-decoration: none;">Security Tips</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>

    `
}


exports.resetPasswordSuccessfulTemplate = (name)=> {
    return `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Successful</title>
    <style>
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0px !important; }
            .content { padding: 30px 20px !important; }
            .cta-button { width: 100% !important; box-sizing: border-box; text-align: center; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <center>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f6;">
            <tr>
                <td align="center" style="padding: 40px 10px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="container" style="width: 100%; max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
                        
                        <!-- Header -->
                        <tr>
                            <td align="center" style="padding: 30px 20px; background-color: #ffffff; border-bottom: 1px solid #eeeeee;">
                                <h1 style="margin: 0; color: #e2c60f; font-size: 24px; font-weight: 800; letter-spacing: 1px;">HEDGENEST</h1>
                            </td>
                        </tr>

                        <!-- Success Content -->
                        <tr>
                            <td class="content" style="padding: 40px; text-align: center; color: #333333;">
                                <!-- Success Icon (Simple Circle Check) -->
                                <div style="margin-bottom: 20px; font-size: 50px; color: #077b24;">✓</div>
                                
                                <h2 style="margin: 0 0 15px; font-size: 22px; font-weight: 700; color: #1a1a1a;">Password Reset Successful</h2>
                                <p style="font-size: 16px; line-height: 1.5; margin: 0 0 30px; color: #666666;">
                                    Hi ${name}, your password for <strong>STICH SURE</strong> has been successfully updated. You can now log back into your account using your new credentials.
                                </p>
                                
                                <!-- CTA Button -->
                                <a href="https://stichsure.com" class="cta-button" style="display: inline-block; background-color: #d7e91b; color: #ffffff; padding: 16px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                    Log In to STICH SURE
                                </a>

                                <!-- Security Warning -->
                                <p style="font-size: 13px; color: #999999; margin-top: 40px; line-height: 1.4; border-top: 1px solid #f3f4f6; padding-top: 20px;">
                                    <strong>Didn't do this?</strong>please secure your account immediately by contacting our support team.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 25px; background-color: #fafafa; font-size: 12px; color: #aaaaaa;">
                                <p style="margin: 0;">&copy; 2026 STICH SURE App. All rights reserved.</p>
                                <p style="margin: 8px 0 0;">
                                    <a href="#" style="color: #b4c30d; text-decoration: none;">Security Settings</a> • 
                                    <a href="#" style="color: #b2d01b; text-decoration: none;">Contact Support</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>

    `
}