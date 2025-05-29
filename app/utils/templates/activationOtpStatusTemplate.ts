export const getUserActivationStatusTemplate = (message: string, email: string): string => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>OTP Verification</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: Arial, sans-serif;">
    <div width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
          <div width="500" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
              <div style="padding: 0 40px;">
                <h2 style="margin-bottom: 20px; color: #2b2e4a;">Welcome to StyleHunt</h2>
                <p style="margin: 0; font-size: 16px; color: #555;">Hi <strong>${email}</strong>,</p>
                <div style="margin: 30px 0;">
                  ${message}
                </div>
              </div>
              <div style="padding: 30px 40px; text-align: center;" align="center">
                <p style="font-size: 12px; color: #aaa;">© 2025 StyleHunt. All rights reserved.</p>
              </div>
          </div>
        </td>
      </tr>
    </div>
  </body>
  </html>
  `;
};
