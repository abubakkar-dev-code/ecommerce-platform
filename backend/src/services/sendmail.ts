
import transporter from "../config/email";
import { env } from "../config/env";

export const passwordResetLink = async (
  email: string,
  resetLink: string,
): Promise<void> => {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "Password Reset",
    text: `click this link to reset your password ${resetLink}`,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 30px;
        background-color: #f5f5f5;
      ">

        <div style="
          background-color: white;
          padding: 30px;
          border-radius: 8px;
        ">

          <h2>Reset Your Password</h2>

          <p>
            We received a request to reset your password.
          </p>

          <p>
            Click the button below to create a new password:
          </p>

          <a
            href="${resetLink}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            "
          >
            Reset Password
          </a>

          <p style="margin-top: 25px;">
            This link will expire in 15 minutes.
          </p>

          <p>
            If you didn't request a password reset,
            you can safely ignore this email.
          </p>

        </div>

      </div>
    `,
  });
};
