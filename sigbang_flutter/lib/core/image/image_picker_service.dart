import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';

class PickedImage {
  final XFile file;
  final Uint8List previewBytes;
  PickedImage({required this.file, required this.previewBytes});
}

class ImagePickerService {
  static final ImagePicker _picker = ImagePicker();
  static bool _busy = false;

  static Future<PickedImage?> pickSingle(ImageSource source) async {
    if (_busy) return null;
    _busy = true;
    try {
      final XFile? file = await _picker.pickImage(
        source: source,
        requestFullMetadata: false,
      );
      if (file == null) return null;
      final bytes = await file.readAsBytes();
      // Placeholder for potential downscaling; keep identity to avoid blocking UI.
      final preview = await compute(_identity, bytes);
      return PickedImage(file: file, previewBytes: preview);
    } finally {
      _busy = false;
    }
  }
}

Uint8List _identity(Uint8List b) => b;


