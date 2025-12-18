import { Controller, Get, Query } from '@nestjs/common';
import { LinkPreviewService, LinkPreview } from './link-preview.service';

@Controller('link-preview')
export class LinkPreviewController {
  constructor(private readonly service: LinkPreviewService) {}

  @Get()
  async get(@Query('url') url: string): Promise<{ data: LinkPreview }> {
    const preview = await this.service.getPreview(url);
    return { data: preview };
  }
}
