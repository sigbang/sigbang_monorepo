import { Injectable, Logger } from '@nestjs/common';
import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
} from '@aws-sdk/client-ses';

export interface MailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface SendMailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
  from?: string;
  attachments?: MailAttachment[];
  configurationSetName?: string;
}

@Injectable()
export class SesMailService {
  private readonly logger = new Logger(SesMailService.name);
  private readonly ses = new SESClient({
    region: process.env.SES_REGION,
  });

  private maskEmail(addr: string): string {
    return addr.replace(/(.).+(@.+)/, '$1***$2');
  }

  async sendMail(params: SendMailParams) {
    const {
      to,
      subject,
      html,
      text,
      replyTo,
      from = process.env.SES_FROM_EMAIL!,
      attachments,
      configurationSetName = process.env.SES_CONFIGURATION_SET,
    } = params;

    const toAddresses = Array.isArray(to) ? to : [to];
    const replyToAddresses = replyTo
      ? Array.isArray(replyTo)
        ? replyTo
        : [replyTo]
      : undefined;

    const attachmentsCount = attachments?.length ?? 0;
    const attachmentsBytes =
      attachments?.reduce((sum, a) => sum + (a.content?.length || 0), 0) ?? 0;

    const maskedTo = toAddresses.map((a) => this.maskEmail(a)).join(', ');
    const maskedReplyTo = replyToAddresses
      ? replyToAddresses.map((a) => this.maskEmail(a)).join(', ')
      : '';

    this.logger.log(
      `[SES] send start region=${process.env.SES_REGION} from=${this.maskEmail(
        from,
      )} toCount=${toAddresses.length} to=${maskedTo} replyTo=${
        maskedReplyTo || '-'
      } attachments=${attachmentsCount} attachmentsBytes=${attachmentsBytes} configSet=${
        configurationSetName || '-'
      } subj="${subject.slice(0, 120)}"`,
    );

    if (attachments && attachments.length > 0) {
      const raw = this.buildMimeMessage({
        from,
        to: toAddresses,
        subject,
        html,
        text,
        replyTo: replyToAddresses,
        attachments,
      });

      const command = new SendRawEmailCommand({
        RawMessage: { Data: raw },
        Source: from,
        Destinations: toAddresses,
        ConfigurationSetName: configurationSetName || undefined,
      });
      try {
        const res = await this.ses.send(command);
        const msgId = (res as any).MessageId || '-';
        const reqId = res?.$metadata?.requestId || '-';
        this.logger.log(`[SES] send success (raw) messageId=${msgId} requestId=${reqId}`);
        return res;
      } catch (err: any) {
        const code = err?.name || err?.code || '-';
        const msg = err?.message || String(err);
        const reqId = err?.$metadata?.requestId || '-';
        this.logger.error(`[SES] send failed (raw) code=${code} requestId=${reqId} msg=${msg}`);
        throw err;
      }
    }

    const command = new SendEmailCommand({
      Destination: { ToAddresses: toAddresses },
      Source: from,
      ReplyToAddresses: replyToAddresses,
      ConfigurationSetName: configurationSetName || undefined,
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: text ? { Data: text, Charset: 'UTF-8' } : undefined,
        },
      },
    });
    try {
      const res = await this.ses.send(command);
      const msgId = (res as any).MessageId || '-';
      const reqId = res?.$metadata?.requestId || '-';
      this.logger.log(`[SES] send success messageId=${msgId} requestId=${reqId}`);
      return res;
    } catch (err: any) {
      const code = err?.name || err?.code || '-';
      const msg = err?.message || String(err);
      const reqId = err?.$metadata?.requestId || '-';
      this.logger.error(`[SES] send failed code=${code} requestId=${reqId} msg=${msg}`);
      throw err;
    }
  }

  private buildMimeMessage(input: {
    from: string;
    to: string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string[];
    attachments: MailAttachment[];
  }): Buffer {
    const boundaryMixed = `mixed_${Date.now().toString(36)}`;
    const boundaryAlt = `alt_${Date.now().toString(36)}`;

    const headers = [
      `From: ${input.from}`,
      `To: ${input.to.join(', ')}`,
      ...(input.replyTo && input.replyTo.length
        ? [`Reply-To: ${input.replyTo.join(', ')}`]
        : []),
      `Subject: ${this.encodeSubject(input.subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundaryMixed}"`,
      '',
      `--${boundaryMixed}`,
      `Content-Type: multipart/alternative; boundary="${boundaryAlt}"`,
      '',
    ];

    const parts: string[] = [];

    // text part
    if (input.text) {
      parts.push(
        `--${boundaryAlt}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: 7bit',
        '',
        input.text,
        '',
      );
    }

    // html part
    parts.push(
      `--${boundaryAlt}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      input.html,
      '',
      `--${boundaryAlt}--`,
      '',
    );

    const attachmentsMime: string[] = [];
    for (const att of input.attachments) {
      const base64 = att.content.toString('base64');
      attachmentsMime.push(
        `--${boundaryMixed}`,
        `Content-Type: ${att.contentType}; name="${this.sanitizeFilename(att.filename)}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${this.sanitizeFilename(att.filename)}"`,
        '',
        base64,
        '',
      );
    }

    const closing = [`--${boundaryMixed}--`, ''];

    const message = [...headers, ...parts, ...attachmentsMime, ...closing].join(
      '\r\n',
    );
    return Buffer.from(message, 'utf-8');
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^\w.\- ]/g, '_');
  }

  private encodeSubject(subject: string): string {
    // Encode as RFC 2047 if non-ASCII
    if (/^[\x00-\x7F]*$/.test(subject)) {
      return subject;
    }
    const b64 = Buffer.from(subject, 'utf-8').toString('base64');
    return `=?UTF-8?B?${b64}?=`;
  }
}


