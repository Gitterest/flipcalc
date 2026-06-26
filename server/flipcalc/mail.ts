import type { FlipCalcServerConfig } from './config'
import type { MailSendResult, MailService } from './types'

export class NullMailService implements MailService {
  async sendMagicLink(): Promise<MailSendResult> {
    return { delivered: false }
  }
}

export class DevMagicLinkMailService implements MailService {
  async sendMagicLink(input: { magicLink: string }): Promise<MailSendResult> {
    return {
      delivered: true,
      devMagicLink: input.magicLink
    }
  }
}

export class ResendMailService implements MailService {
  constructor(
    private readonly apiKey: string,
    private readonly from: string
  ) {}

  async sendMagicLink(input: { email: string; magicLink: string; expiresAt: string }): Promise<MailSendResult> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: this.from,
        to: input.email,
        subject: 'Access FlipCalc Pro',
        text: [
          'Use this private link to access FlipCalc Pro:',
          '',
          input.magicLink,
          '',
          `This link expires at ${input.expiresAt}.`,
          'If you did not request this link, you can ignore this email.'
        ].join('\n')
      })
    })

    return { delivered: response.ok }
  }
}

export function createMailService(config: FlipCalcServerConfig): MailService {
  if (config.resendApiKey !== null && config.accessEmailFrom !== null) {
    return new ResendMailService(config.resendApiKey, config.accessEmailFrom)
  }

  if (config.nodeEnv !== 'production' && config.exposeDevMagicLinks) {
    return new DevMagicLinkMailService()
  }

  return new NullMailService()
}
