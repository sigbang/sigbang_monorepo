import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

Future<ImageSource?> showImageSourceSheet(BuildContext context, {bool includePresets = false}) {
  return showModalBottomSheet<ImageSource>(
    context: context,
    builder: (ctx) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.photo),
            title: const Text('앨범에서 선택'),
            onTap: () => Navigator.pop(ctx, ImageSource.gallery),
          ),
          ListTile(
            leading: const Icon(Icons.camera_alt),
            title: const Text('카메라로 촬영'),
            onTap: () => Navigator.pop(ctx, ImageSource.camera),
          ),
          if (includePresets)
            ListTile(
              leading: const Icon(Icons.collections),
              title: const Text('기본 이미지 선택'),
              onTap: () => Navigator.pop(ctx, null),
            ),
          ListTile(
            title: const Text('취소'),
            onTap: () => Navigator.pop(ctx, null),
          ),
        ],
      ),
    ),
  );
}


