export const contactSupportDeactivatedUserTemplate = (email: string, name: string): string => {
  return `
  <!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Deactivated Account Support Request</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f5f7fa;
        margin: 0;
        padding: 0;
      }
      .container {
        background-color: #ffffff;
        max-width: 600px;
        margin: 40px auto;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
      }
      h2 {
        color: #333333;
      }
      p {
        color: #555555;
        line-height: 1.6;
      }
      .user-info {
        margin-top: 20px;
        padding: 15px;
        background-color: #f1f1f1;
        border-radius: 5px;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #999999;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Account Deactivation Support Request</h2>
      <p>Hello Support Team,</p>
      <p>
        I’m unable to access my account due to deactivation. Please assist me in understanding the
        reason and guide me on how to reactivate it.
      </p>

      <div class="user-info">
        <strong>User Details:</strong><br />
        Name: ${name}<br />
        Email: ${email}<br />
      </div>

      <p>
        Looking forward to your support.<br />
        Thank you!
      </p>

      <p>Best regards,<br />${name}</p>

      <div class="footer">This is an automated email sent from the support request form.</div>
    </div>
  </body>
</html>
  `;
};
