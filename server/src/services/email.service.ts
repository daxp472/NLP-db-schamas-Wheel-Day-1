import { ENV } from '../config/env';

export interface EmailDeliveryResult {
  sent: boolean;
  provider: 'smtp' | 'console' | 'memory';
  messageId?: string;
  previewUrl?: string;
  note?: string;
}

export class EmailService {
  /**
   * Internal store for testing and preview links in local/development mode
   */
  private static recentDispatches: Array<{
    type: 'password_reset' | 'email_verification' | 'collaboration_invitation';
    to: string;
    token: string;
    actionUrl: string;
    timestamp: Date;
  }> = [];

  /**
   * Dispatch password reset email
   */
  public static async sendPasswordResetEmail(
    to: string,
    resetToken: string
  ): Promise<EmailDeliveryResult> {
    const actionUrl = `${ENV.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

    this.recentDispatches.push({
      type: 'password_reset',
      to,
      token: resetToken,
      actionUrl,
      timestamp: new Date(),
    });

    if (ENV.NODE_ENV === 'production' && !ENV.SMTP_HOST) {
      console.log(`[EmailService] Password reset requested for ${to.replace(/(?<=.{2}).(?=[^@]*?@)/g, '*')}. Provider: Unconfigured`);
      return {
        sent: false,
        provider: 'smtp',
        note: 'Email provider not configured in production. Configure SMTP_HOST / SENDGRID_API_KEY.',
      };
    }

    console.log(`[EmailService (Dev)] Password reset token generated for ${to}:`);
    console.log(`[EmailService (Dev)] Link: ${actionUrl}`);

    return {
      sent: true,
      provider: 'console',
      previewUrl: actionUrl,
      note: 'Simulated email delivery for local development and testing.',
    };
  }

  /**
   * Dispatch email verification notice
   */
  public static async sendVerificationEmail(
    to: string,
    verificationToken: string
  ): Promise<EmailDeliveryResult> {
    const actionUrl = `${ENV.FRONTEND_URL}/verify-email?token=${encodeURIComponent(verificationToken)}`;

    this.recentDispatches.push({
      type: 'email_verification',
      to,
      token: verificationToken,
      actionUrl,
      timestamp: new Date(),
    });

    if (ENV.NODE_ENV === 'production' && !ENV.SMTP_HOST) {
      console.log(`[EmailService] Verification dispatch queued for ${to.replace(/(?<=.{2}).(?=[^@]*?@)/g, '*')}`);
      return {
        sent: false,
        provider: 'smtp',
        note: 'Email provider not configured in production. Configure SMTP_HOST / SENDGRID_API_KEY.',
      };
    }

    console.log(`[EmailService (Dev)] Verification link generated for ${to}:`);
    console.log(`[EmailService (Dev)] Link: ${actionUrl}`);

    return {
      sent: true,
      provider: 'console',
      previewUrl: actionUrl,
      note: 'Simulated email delivery for local development.',
    };
  }

  /**
   * Dispatch project collaboration invitation notice
   */
  public static async sendInvitationEmail(
    to: string,
    projectName: string,
    inviterName: string,
    role: string,
    invitationToken: string
  ): Promise<EmailDeliveryResult> {
    const actionUrl = `${ENV.FRONTEND_URL}/collaboration?invite=${encodeURIComponent(invitationToken)}`;

    this.recentDispatches.push({
      type: 'collaboration_invitation',
      to,
      token: invitationToken,
      actionUrl,
      timestamp: new Date(),
    });

    if (ENV.NODE_ENV === 'production' && !ENV.SMTP_HOST) {
      console.log(`[EmailService] Invitation to "${projectName}" (${role}) queued for ${to.replace(/(?<=.{2}).(?=[^@]*?@)/g, '*')}`);
      return {
        sent: false,
        provider: 'smtp',
        note: 'Email provider not configured in production. Configure SMTP_HOST / SENDGRID_API_KEY.',
      };
    }

    console.log(`[EmailService (Dev)] Collaboration invite for ${to} to project "${projectName}" by ${inviterName}:`);
    console.log(`[EmailService (Dev)] Invite Link: ${actionUrl}`);

    return {
      sent: true,
      provider: 'console',
      previewUrl: actionUrl,
      note: 'Simulated email invitation for local development.',
    };
  }

  /**
   * Helper for tests to inspect the latest dispatched token
   */
  public static getLatestTokenFor(
    email: string,
    type: 'password_reset' | 'email_verification' | 'collaboration_invitation'
  ): string | undefined {
    const match = this.recentDispatches
      .filter((d) => d.to.toLowerCase() === email.toLowerCase() && d.type === type)
      .slice(-1)[0];
    return match?.token;
  }

  public static clearDispatches(): void {
    this.recentDispatches = [];
  }
}
