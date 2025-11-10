import { Injectable } from '@nestjs/common';
import { SesMailService } from '../common/services/ses-mail.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { MailAttachment } from '../common/services/ses-mail.service';

interface FeedbackContext {
  ip?: string;
  userAgent?: string;
  deviceId?: string;
  deviceName?: string;
  userEmail?: string;
}

@Injectable()
export class FeedbackService {
  constructor(private readonly mail: SesMailService) {}

  async submit(
    dto: CreateFeedbackDto,
    ctx: FeedbackContext,
    attachments: MailAttachment[] = [],
  ) {
    const to = process.env.SES_TO_EMAIL!;
    const subject = `[${dto.type.toUpperCase()}] ${dto.subject}`;

    const html = this.renderHtml(dto, ctx);
    const text = this.renderText(dto, ctx);

    await this.mail.sendMail({
      to,
      subject,
      html,
      text,
      replyTo: ctx.userEmail,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    return { ok: true };
  }

  private renderHtml(dto: CreateFeedbackDto, ctx: FeedbackContext): string {
    return `
      <div style="font-family:system-ui,Segoe UI,Apple SD Gothic Neo,sans-serif;">
        <h2 style="margin:0 0 8px;">피드백 접수: ${escapeHtml(dto.type)}</h2>
        <h3 style="margin:0 0 12px;">${escapeHtml(dto.subject)}</h3>
        <pre style="white-space:pre-wrap;font:inherit;margin:0 0 8px;">${escapeHtml(dto.message)}</pre>
        <hr/>
        <table style="font-size:13px;color:#555">
          ${dto.pageUrl ? `<tr><td style="padding:2px 8px;">Page</td><td><a href="${dto.pageUrl}">${dto.pageUrl}</a></td></tr>` : ''}
          ${dto.appVersion ? `<tr><td style="padding:2px 8px;">App</td><td>${escapeHtml(dto.appVersion)}</td></tr>` : ''}
          ${ctx.userAgent ? `<tr><td style="padding:2px 8px;">UA</td><td>${escapeHtml(ctx.userAgent)}</td></tr>` : ''}
          ${ctx.ip ? `<tr><td style="padding:2px 8px;">IP</td><td>${escapeHtml(ctx.ip)}</td></tr>` : ''}
          ${ctx.deviceId ? `<tr><td style="padding:2px 8px;">DeviceId</td><td>${escapeHtml(ctx.deviceId)}</td></tr>` : ''}
          ${ctx.deviceName ? `<tr><td style="padding:2px 8px;">DeviceName</td><td>${escapeHtml(ctx.deviceName)}</td></tr>` : ''}
          ${ctx.userEmail ? `<tr><td style="padding:2px 8px;">User</td><td>${escapeHtml(ctx.userEmail)}</td></tr>` : ''}
          <tr><td style="padding:2px 8px;">Env</td><td>${escapeHtml(process.env.NODE_ENV || 'development')}</td></tr>
        </table>
      </div>
    `;
  }

  private renderText(dto: CreateFeedbackDto, ctx: FeedbackContext): string {
    return [
      `Type: ${dto.type}`,
      `Subject: ${dto.subject}`,
      `Message:\n${dto.message}`,
      dto.pageUrl ? `Page: ${dto.pageUrl}` : '',
      dto.appVersion ? `App: ${dto.appVersion}` : '',
      ctx.userAgent ? `UA: ${ctx.userAgent}` : '',
      ctx.ip ? `IP: ${ctx.ip}` : '',
      ctx.deviceId ? `DeviceId: ${ctx.deviceId}` : '',
      ctx.deviceName ? `DeviceName: ${ctx.deviceName}` : '',
      ctx.userEmail ? `User: ${ctx.userEmail}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}


