exports.emailTemplate = (name) => {
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
                                    Hi ${name}, welcome to Stitch Sure. Your requst is currently in progress
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