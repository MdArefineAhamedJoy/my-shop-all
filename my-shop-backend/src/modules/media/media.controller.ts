import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { Permissions, Public, Rate } from "../../common/security";
import { ConfigService } from "@nestjs/config";

@ApiTags("Media")
@ApiBearerAuth()
@Controller("media")
export class MediaController {
  constructor(private config: ConfigService) {}
  @Permissions("catalog:write")
  @Rate(20)
  @Post("images")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (
      !file?.buffer ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
    )
      throw new BadRequestException(
        "Upload one JPEG, PNG or WebP image of at most 5 MB",
      );
    let buffer: Buffer;
    try {
      const input = sharp(file.buffer, {
        limitInputPixels: 25000000,
        animated: false,
      });
      const metadata = await input.metadata();
      if (
        !["jpeg", "png", "webp"].includes(metadata.format || "") ||
        (metadata.pages || 1) > 1
      )
        throw new Error();
      // Decode/re-encode strips untrusted metadata and prevents serving executable uploads.
      buffer = await input
        .rotate()
        .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        "Image is invalid, animated or exceeds the 25 megapixel limit",
      );
    }
    const name = `${randomUUID()}.webp`;
    const dir = resolve("storage", "images");
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, name), buffer, { flag: "wx" });
    return {
      url: `${this.config.getOrThrow<string>("APP_URL").replace(/\/$/, "")}/v1/media/images/${name}`,
      filename: name,
      bytes: buffer.length,
    };
  }
  @Public() @Get("images/:name") image(
    @Param("name") name: string,
    @Res() res: Response,
  ) {
    if (!/^[a-f\d-]{36}\.webp$/.test(name))
      throw new BadRequestException("Invalid image filename");
    res.setHeader("Content-Type", "image/webp");
    // Public media is embedded by the storefront/admin/mobile on separate origins.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.sendFile(resolve("storage", "images", name));
  }
}
