import 'package:flutter/material.dart';
import 'dart:io';

class PhotoUploadWidget extends StatelessWidget {
  final String? imagePath;
  final VoidCallback onTap;
  final VoidCallback? onRemove;
  final String label;
  final bool isRequired;
  final String? error;

  const PhotoUploadWidget({
    super.key,
    this.imagePath,
    required this.onTap,
    this.onRemove,
    required this.label,
    this.isRequired = false,
    this.error,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 라벨
        Row(
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            if (isRequired) ...[
              const SizedBox(width: 4),
              Text(
                '*',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),

        // 이미지 업로드 영역
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: double.infinity,
            height: 200,
            decoration: BoxDecoration(
              color: imagePath != null
                  ? Colors.transparent
                  : Theme.of(context)
                      .colorScheme
                      .surfaceContainerHighest
                      .withOpacity(0.3),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: error != null
                    ? Theme.of(context).colorScheme.error
                    : Theme.of(context).colorScheme.outline.withOpacity(0.3),
                width: error != null ? 2 : 1,
              ),
            ),
            child: imagePath != null
                ? Stack(
                    children: [
                      // 이미지
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: SizedBox(
                          width: double.infinity,
                          height: double.infinity,
                          child: imagePath!.startsWith('http')
                              ? Image.network(
                                  imagePath!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return _buildPlaceholder(context);
                                  },
                                )
                              : Image.file(
                                  File(imagePath!),
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return _buildPlaceholder(context);
                                  },
                                ),
                        ),
                      ),

                      // 오버레이 버튼들
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // 변경 버튼
                            _buildOverlayButton(
                              context,
                              icon: Icons.edit,
                              onTap: onTap,
                              tooltip: '이미지 변경',
                            ),
                            if (onRemove != null) ...[
                              const SizedBox(width: 8),
                              // 삭제 버튼
                              _buildOverlayButton(
                                context,
                                icon: Icons.delete,
                                onTap: onRemove!,
                                tooltip: '이미지 삭제',
                                color: Theme.of(context).colorScheme.error,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  )
                : _buildPlaceholder(context),
          ),
        ),

        // 에러 메시지
        if (error != null) ...[
          const SizedBox(height: 8),
          Text(
            error!,
            style: TextStyle(
              color: Theme.of(context).colorScheme.error,
              fontSize: 12,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPlaceholder(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.add_photo_alternate,
          size: 48,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        const SizedBox(height: 8),
        Text(
          '사진 추가',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          '탭하여 사진을 선택하세요',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
      ],
    );
  }

  Widget _buildOverlayButton(
    BuildContext context, {
    required IconData icon,
    required VoidCallback onTap,
    required String tooltip,
    Color? color,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(20),
      ),
      child: IconButton(
        icon: Icon(
          icon,
          color: color ?? Colors.white,
          size: 20,
        ),
        onPressed: onTap,
        tooltip: tooltip,
        constraints: const BoxConstraints(
          minWidth: 36,
          minHeight: 36,
        ),
      ),
    );
  }
}
