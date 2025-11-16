import { Injectable } from '@nestjs/common';
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
  private readonly ses = new SESClient({
    region: process.env.SES_REGION,
  });

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

    if (attachments && attachments.length > 0) {
      const raw = this.buildMimeMessage({
        from,
        to: toAddresses,
        subject,
        html,
        text,
        attachments,
      });

      const command = new SendRawEmailCommand({
        RawMessage: { Data: raw },
        Source: from,
        Destinations: toAddresses,
        ConfigurationSetName: configurationSetName || undefined,
      });
      return this.ses.send(command);
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
    return this.ses.send(command);
  }

  private buildMimeMessage(input: {
    from: string;
    to: string[];
    subject: string;
    html: string;
    text?: string;
    attachments: MailAttachment[];
  }): Buffer {
    const boundaryMixed = `mixed_${Date.now().toString(36)}`;
    const boundaryAlt = `alt_${Date.now().toString(36)}`;

    const headers = [
      `From: ${input.from}`,
      `To: ${input.to.join(', ')}`,
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


