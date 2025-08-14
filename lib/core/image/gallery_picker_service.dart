import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:wechat_assets_picker/wechat_assets_picker.dart';

class GalleryPickerService {
  static const Set<String> allowedMimeTypes = {
    'image/jpeg',
    'image/png',
    'image/webp',
  };

  /// Opens an advanced gallery picker with image-only filter and optional initial album hint.
  /// Returns the selected image bytes, or null if cancelled.
  static Future<Uint8List?> pickSingleImageBytes(BuildContext context,
      {bool preferCameraRoll = true}) async {
    // Request permissions
    final PermissionState ps = await PhotoManager.requestPermissionExtend();
    if (!ps.isAuth) {
      return null;
    }

    // Prepare assets picker config
    final ThemeData theme = Theme.of(context);
    final AssetPickerConfig config = AssetPickerConfig(
      maxAssets: 1,
      requestType: RequestType.image,
      filterOptions: FilterOptionGroup(
        imageOption: const FilterOption(
          needTitle: true,
        ),
        orders: [
          const OrderOption(type: OrderOptionType.createDate, asc: false),
        ],
      ),
      // Use default text delegate which follows system locale automatically
      textDelegate: const KoreanAssetPickerTextDelegate(),
      // Use only one of themeColor or pickerTheme to avoid assertion
      themeColor: theme.colorScheme.primary,
      selectPredicate: (context, asset, isSelected) async {
        final mime = await asset.mimeTypeAsync;
        if (mime == null) return false;
        return allowedMimeTypes.contains(mime);
      },
    );

    // Try to hint initial album (camera roll) if requested
    // Note: initial album hint omitted to avoid further assertions with certain versions

    final List<AssetEntity>? result = await AssetPicker.pickAssets(
      context,
      pickerConfig: config,
    );

    if (result == null || result.isEmpty) return null;

    final AssetEntity asset = result.first;
    final Uint8List? bytes = await asset.originBytes;
    return bytes;
  }
}
