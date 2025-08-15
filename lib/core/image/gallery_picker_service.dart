import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:wechat_assets_picker/wechat_assets_picker.dart';
import 'package:photo_manager/photo_manager.dart';

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
    // Ensure permissions with user-facing flow when denied
    final bool hasPermission = await _ensurePhotoPermission(context);
    if (!hasPermission) return null;

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

  static Future<bool> _ensurePhotoPermission(BuildContext context) async {
    PermissionState state = await PhotoManager.requestPermissionExtend();

    bool isState = state.hasAccess;
    if (state == PermissionState.authorized ||
        state == PermissionState.limited) {
      return true;
    } // authorized or limited

    final bool? openSettings = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('사진 접근 권한이 필요합니다'),
        content: const Text('사진을 선택하려면 기기의 사진 접근 권한이 필요합니다. 설정에서 권한을 허용해 주세요.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('설정 열기'),
          ),
        ],
      ),
    );

    if (openSettings == true) {
      await PhotoManager.openSetting();
      state = await PhotoManager.requestPermissionExtend();
      if (state.isAuth) return true;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('권한이 허용되지 않아 사진을 선택할 수 없습니다.')),
      );
    }

    return false;
  }
}
