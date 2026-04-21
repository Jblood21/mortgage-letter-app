// Email Service using Resend
import { Resend } from 'resend';

interface EmailConfig {
  apiKey: string;
  fromEmail?: string;
  fromName?: string;
}

interface SendLetterEmailParams {
  to: string[];
  borrowerName: string;
  loanOfficerName: string;
  companyName: string;
  preApprovalAmount: string;
  expirationDate: string;
  letterPdfUrl?: string;
  letterPdfBase64?: string;
  portalLink?: string;
}

interface SendReminderEmailParams {
  to: string;
  borrowerName: string;
  loanOfficerName: string;
  loanOfficerPhone: string;
  loanOfficerEmail: string;
  preApprovalAmount: string;
  expirationDate: string;
  daysRemaining: number;
}

export class EmailService {
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;

  constructor(config: EmailConfig) {
    this.resend = new Resend(config.apiKey);
    this.fromEmail = config.fromEmail || 'letters@yourmortgagecompany.com';
    this.fromName = config.fromName || 'Mortgage Pre-Approval';
  }

  async sendPreApprovalLetter(params: SendLetterEmailParams): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const attachments = params.letterPdfBase64
        ? [
            {
              filename: `PreApproval_${params.borrowerName.replace(/\s+/g, '_')}.pdf`,
              content: params.letterPdfBase64,
            },
          ]
        : [];

      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: params.to,
        subject: `Pre-Approval Letter - ${params.borrowerName} - ${params.preApprovalAmount}`,
        html: this.getPreApprovalEmailTemplate(params),
        attachments,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async sendExpirationReminder(params: SendReminderEmailParams): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: params.to,
        subject: `Your Pre-Approval Expires in ${params.daysRemaining} Days`,
        html: this.getExpirationReminderTemplate(params),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async sendBorrowerPortalLink(params: {
    to: string;
    borrowerName: string;
    companyName: string;
    portalLink: string;
    expiresIn: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: params.to,
        subject: `Access Your Pre-Approval Documents - ${params.companyName}`,
        html: this.getBorrowerPortalEmailTemplate(params),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  private getPreApprovalEmailTemplate(params: SendLetterEmailParams): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1e40af; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${params.companyName}</h1>
    <p style="color: #93c5fd; margin: 10px 0 0;">Pre-Approval Letter</p>
  </div>

  <div style="background-color: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Dear ${params.borrowerName},</p>

    <p>Congratulations! Your mortgage pre-approval letter is ready.</p>

    <div style="background-color: #dbeafe; border-left: 4px solid #1e40af; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">Pre-Approved Amount</p>
      <p style="margin: 5px 0 0; font-size: 28px; font-weight: bold; color: #1e3a8a;">${params.preApprovalAmount}</p>
    </div>

    <p><strong>Important:</strong> This pre-approval is valid until <strong>${params.expirationDate}</strong>.</p>

    ${params.portalLink ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.portalLink}" style="display: inline-block; background-color: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        View Your Pre-Approval Letter
      </a>
    </div>
    ` : '<p>Your pre-approval letter is attached to this email.</p>'}

    <p>If you have any questions or are ready to move forward with your home purchase, please don't hesitate to contact me.</p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0;"><strong>${params.loanOfficerName}</strong></p>
      <p style="margin: 5px 0; color: #64748b;">${params.companyName}</p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p>This is a pre-approval only and does not constitute a commitment to lend.</p>
    <p>Equal Housing Lender</p>
  </div>
</body>
</html>
    `;
  }

  private getExpirationReminderTemplate(params: SendReminderEmailParams): string {
    const urgencyColor = params.daysRemaining <= 3 ? '#dc2626' : params.daysRemaining <= 7 ? '#f59e0b' : '#1e40af';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: ${urgencyColor}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Pre-Approval Expiring Soon</h1>
    <p style="color: white; margin: 10px 0 0; opacity: 0.9;">${params.daysRemaining} days remaining</p>
  </div>

  <div style="background-color: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Dear ${params.borrowerName},</p>

    <p>This is a friendly reminder that your mortgage pre-approval letter will expire on <strong>${params.expirationDate}</strong>.</p>

    <div style="background-color: #fef3c7; border-left: 4px solid ${urgencyColor}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">Your Pre-Approval Amount</p>
      <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #78350f;">${params.preApprovalAmount}</p>
      <p style="margin: 10px 0 0; font-size: 14px; color: #92400e;">Expires: ${params.expirationDate}</p>
    </div>

    <p>If you're still in the market for a home, please contact me to renew your pre-approval before it expires. If your financial situation has changed, we may need to update your application.</p>

    <p>Don't miss out on your dream home! Reach out today to keep your pre-approval active.</p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0;"><strong>${params.loanOfficerName}</strong></p>
      <p style="margin: 5px 0; color: #64748b;">Phone: ${params.loanOfficerPhone}</p>
      <p style="margin: 5px 0; color: #64748b;">Email: ${params.loanOfficerEmail}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getBorrowerPortalEmailTemplate(params: {
    borrowerName: string;
    companyName: string;
    portalLink: string;
    expiresIn: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1e40af; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${params.companyName}</h1>
    <p style="color: #93c5fd; margin: 10px 0 0;">Secure Document Portal</p>
  </div>

  <div style="background-color: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Dear ${params.borrowerName},</p>

    <p>You can securely access your pre-approval documents using the link below:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.portalLink}" style="display: inline-block; background-color: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Access Your Documents
      </a>
    </div>

    <p style="color: #64748b; font-size: 14px;">This link will expire in ${params.expiresIn}. If you need access after that, please contact your loan officer.</p>

    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Security Notice:</strong> Never share this link with anyone. If you didn't request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export function createEmailService(apiKey: string, fromEmail?: string, fromName?: string): EmailService {
  return new EmailService({ apiKey, fromEmail, fromName });
}
