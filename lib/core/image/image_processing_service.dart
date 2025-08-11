import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';

class ImageConstraints {
  static const int minResolution = 512; // min 512x512
  static const int recommendedResolution = 1080; // 1080x1080 for upload
  static const int maxResolution = 2048; // cap at 2048x2048
  static const int hardSizeLimitBytes = 5 * 1024 * 1024; // 5MB
  static const int softSizeRecommendBytes = 2 * 1024 * 1024; // 2MB
}

enum OutputFormat { jpeg, webp }

class ProcessedImage {
  final Uint8List bytes;
  final String mimeType; // image/jpeg or image/webp
  final int width;
  final int height;
  final File?
      tempFile; // where bytes saved for multipart file upload convenience

  ProcessedImage({
    required this.bytes,
    required this.mimeType,
    required this.width,
    required this.height,
    this.tempFile,
  });
}

class ImageProcessingService {
  /// Ensures 1:1 crop, resizes within min..max, and compresses to <= hard limit
  /// Returns bytes and a temp file for easy multipart upload.
  static Future<ProcessedImage> processCroppedBytes({
    required Uint8List croppedBytes,
    OutputFormat format = OutputFormat.webp,
    int targetResolution = ImageConstraints.recommendedResolution,
    int minResolution = ImageConstraints.minResolution,
    int maxResolution = ImageConstraints.maxResolution,
    int maxBytes = ImageConstraints.hardSizeLimitBytes,
  }) async {
    // Decode
    final decoded = img.decodeImage(croppedBytes);
    if (decoded == null) {
      throw Exception('이미지를 디코드할 수 없습니다');
    }

    // Ensure square; if not, center crop to square
    final int minSide =
        decoded.width < decoded.height ? decoded.width : decoded.height;
    img.Image square = decoded;
    if (decoded.width != decoded.height) {
      final int x = (decoded.width - minSide) ~/ 2;
      final int y = (decoded.height - minSide) ~/ 2;
      square =
          img.copyCrop(decoded, x: x, y: y, width: minSide, height: minSide);
    }

    // Clamp target size between min and max
    final int clampedTarget =
        targetResolution.clamp(minResolution, maxResolution);
    img.Image resized = img.copyResize(square,
        width: clampedTarget,
        height: clampedTarget,
        interpolation: img.Interpolation.average);

    // Try compress in steps to meet size <= maxBytes, prefer <= 2MB when possible
    Uint8List encoded = await _encode(resized, format: format, quality: 90);
    if (encoded.lengthInBytes > maxBytes) {
      // reduce dimensions progressively if needed
      final List<int> scales = [85, 75, 65, 55, 45, 35];
      for (final q in scales) {
        encoded = await _encode(resized, format: format, quality: q);
        if (encoded.lengthInBytes <= maxBytes) break;
      }
      // If still too large, resize down 25% steps
      int currentSize = clampedTarget;
      while (encoded.lengthInBytes > maxBytes && currentSize > minResolution) {
        currentSize = (currentSize * 0.85).round();
        if (currentSize < minResolution) currentSize = minResolution;
        resized = img.copyResize(resized,
            width: currentSize,
            height: currentSize,
            interpolation: img.Interpolation.average);
        encoded = await _encode(resized, format: format, quality: 70);
      }
    }

    // Write to temp file for MultipartFile.fromFile
    final tmpDir = await getTemporaryDirectory();
    final ext = format == OutputFormat.webp ? 'webp' : 'jpg';
    final file = File(
        '${tmpDir.path}/processed_${DateTime.now().millisecondsSinceEpoch}.$ext');
    await file.writeAsBytes(encoded, flush: true);

    if (kDebugMode) {
      debugPrint(
          'Processed image: ${encoded.lengthInBytes} bytes, ${resized.width}x${resized.height}, ${file.path}');
    }

    return ProcessedImage(
      bytes: encoded,
      mimeType: format == OutputFormat.webp ? 'image/webp' : 'image/jpeg',
      width: resized.width,
      height: resized.height,
      tempFile: file,
    );
  }

  static Future<Uint8List> _encode(img.Image image,
      {required OutputFormat format, required int quality}) async {
    // Encode to PNG intermediate, then use flutter_image_compress to target JPEG/WebP
    final pngBytes = Uint8List.fromList(img.encodePng(image));
    final targetFormat =
        format == OutputFormat.webp ? CompressFormat.webp : CompressFormat.jpeg;
    final compressed = await FlutterImageCompress.compressWithList(
      pngBytes,
      format: targetFormat,
      quality: quality,
    );
    return Uint8List.fromList(compressed);
  }
}
