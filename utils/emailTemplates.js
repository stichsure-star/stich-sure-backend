exports.signUpTemplate = (name, otp) => {
    return `
    <!DOCTYPE html>
<html>
<head>
<title></title>
</head>
<body style="width:100%;height:100vh;background-color: lightblue;display: flex;align-items: center;justify-content: center;">
<div style="background-color: white; padding: 20px; border-radius: 10px; width: 400px; margin: auto; text-align: center;">
<h1>Welcome ${name}</h1>
<p>Your one-time verification code: </p>
<h1>${otp}</h1>
<p>This code expires after 5 minutes. If you did not request this, please change your password or contact customer Support.</p>
</div>
</body>
</html>
    `
}