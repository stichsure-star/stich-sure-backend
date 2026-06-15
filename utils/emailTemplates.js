exports.emailTemplate = (name, otp, expiryMinutes = 5) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stitch Sure email verification code</title>

    <style>
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0px !important; }
            .otp-code { font-size: 32px !important; letter-spacing: 6px !important; }
            .content { padding: 30px 20px !important; }
        }
    </style>
</head>

<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <center>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
            <tr>
                <td align="center" style="padding: 40px 10px;">

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="container" style="width: 100%; max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">

                        <!-- Header -->
                        <tr>
                            <td align="center" style="padding: 30px 20px; background-color: #ffffff; border-bottom: 2px solid #d4af37;">
                                <h1 style="margin: 0; color: #1e3a8a; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
                                    Stitch Sure
                                </h1>
                            </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                            <td class="content" style="padding: 40px; text-align: center; color: #333333;">

                                <h2 style="margin: 0 0 15px; font-size: 22px; font-weight: 700; color: #1e3a8a;">
                                    Email Verification
                                </h2>

                                <p style="font-size: 16px; line-height: 1.5; margin: 0 0 25px; color: #666666;">
                                    Hi ${name}, welcome to Stitch Sure. Use the verification code below to verify your email address.
                                </p>

                                <!-- OTP Box -->
                                <div style="background-color: #f8fafc; border: 2px dashed #d4af37; border-radius: 12px; padding: 25px; margin: 20px 0;">
                                    <span class="otp-code" style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: bold; letter-spacing: 10px; color: #1e3a8a; display: block;">
                                        ${otp}
                                    </span>
                                </div>

                                <p style="font-size: 14px; color: #999999; margin-top: 25px; line-height: 1.4;">
                                    This code is valid for <strong>${expiryMinutes} minutes</strong>.<br>
                                    Please do not share this code with anyone.
                                </p>

                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 25px; background-color: #fafafa; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee;">
                                <p style="margin: 0;">
                                    &copy; ${new Date().getFullYear()} Stitch Sure. All rights reserved.
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
`;
};


exports.resetPasswordTemplate = (name, otp, expiryMinutes = 5) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Stitch Sure Password</title>

    <style>
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0px !important; }
            .otp-code { font-size: 32px !important; letter-spacing: 6px !important; }
            .content { padding: 30px 20px !important; }
        }
    </style>
</head>

<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<center>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
<tr>
<td align="center" style="padding:40px 10px;">

<table role="presentation" class="container" style="width:100%;max-width:500px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);">

<tr>
<td align="center" style="padding:30px 20px;background:#ffffff;border-bottom:2px solid #d4af37;">
<h1 style="margin:0;color:#1e3a8a;font-size:24px;font-weight:800;letter-spacing:1px;">
Stitch Sure
</h1>
</td>
</tr>

<tr>
<td class="content" style="padding:40px;text-align:center;color:#333333;">

<h2 style="margin:0 0 15px;font-size:22px;font-weight:700;color:#1e3a8a;">
Password Reset
</h2>

<p style="font-size:16px;line-height:1.5;margin:0 0 25px;color:#666666;">
Hi ${name}, we received a request to reset your password. Use the code below to proceed:
</p>

<div style="background:#f8fafc;border:2px dashed #d4af37;border-radius:12px;padding:25px;margin:20px 0;">
<span class="otp-code" style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:bold;letter-spacing:10px;color:#1e3a8a;display:block;">
${otp}
</span>
</div>

<p style="font-size:14px;color:#999999;margin-top:25px;line-height:1.4;">
This code is valid for <strong>${expiryMinutes} minutes</strong>.<br>
If you didn't request this, please ignore this email or contact support if you're concerned about your account security.
</p>

</td>
</tr>

<tr>
<td align="center" style="padding:25px;background:#fafafa;font-size:12px;color:#888888;border-top:1px solid #eeeeee;">
<p style="margin:0;">&copy; ${new Date().getFullYear()} Stitch Sure. All rights reserved.</p>
</td>
</tr>

</table>

</td>
</tr>
</table>
</center>
</body>
</html>
`;
};

exports.resetPasswordSuccessfulTemplate = (name) => {
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

            .cta-button {
                width: 100% !important;
                box-sizing: border-box;
                text-align: center;
            }
        }
    </style>
</head>

<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<center>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
<tr>
<td align="center" style="padding:40px 10px;">

<table role="presentation" class="container" style="width:100%;max-width:500px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);">

<tr>
<td align="center" style="padding:30px 20px;background:#ffffff;border-bottom:2px solid #d4af37;">
<h1 style="margin:0;color:#1e3a8a;font-size:24px;font-weight:800;letter-spacing:1px;">
Stitch Sure
</h1>
</td>
</tr>

<tr>
<td class="content" style="padding:40px;text-align:center;color:#333333;">

<div style="margin-bottom:20px;font-size:50px;color:#1e3a8a;">
✓
</div>

<h2 style="margin:0 0 15px;font-size:22px;font-weight:700;color:#1e3a8a;">
Password Reset Successful
</h2>

<p style="font-size:16px;line-height:1.5;margin:0 0 30px;color:#666666;">
Hi ${name}, your password for <strong>Stitch Sure</strong> has been successfully updated.
You can now log back into your account using your new credentials.
</p>

<a href="https://stichsure.com"
class="cta-button"
style="
display:inline-block;
background-color:#1e3a8a;
color:#ffffff;
padding:16px 35px;
text-decoration:none;
border-radius:8px;
font-weight:bold;
font-size:16px;
">
Log In to Stitch Sure
</a>

<p style="font-size:13px;color:#999999;margin-top:40px;line-height:1.4;border-top:1px solid #f3f4f6;padding-top:20px;">
<strong>Didn't do this?</strong>
If you did not reset your password, please secure your account immediately by contacting our support team.
</p>

</td>
</tr>

<tr>
<td align="center" style="padding:25px;background:#fafafa;font-size:12px;color:#888888;border-top:1px solid #eeeeee;">
<p style="margin:0;">&copy; ${new Date().getFullYear()} Stitch Sure. All rights reserved.</p>
</td>
</tr>

</table>

</td>
</tr>
</table>

</center>
</body>
</html>
`;
};

exports.verificationTextTemplate = (name, otp, expiryMinutes = 5) =>
    `Hi ${name}, your Stitch Sure email verification code is ${otp}. This code expires in ${expiryMinutes} minutes. If you did not request this, you can ignore this email.`;

exports.resetPasswordTextTemplate = (name, otp, expiryMinutes = 5) =>
    `Hi ${name}, your Stitch Sure password reset code is ${otp}. This code expires in ${expiryMinutes} minutes. If you did not request this, you can ignore this email.`;
