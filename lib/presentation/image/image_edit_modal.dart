import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;
import '../common/widgets/app_logo.dart';

class ImageEditModal extends StatefulWidget {
  final Uint8List originalBytes;
  const ImageEditModal({super.key, required this.originalBytes});

  @override
  State<ImageEditModal> createState() => _ImageEditModalState();
}

class _ImageEditModalState extends State<ImageEditModal> {
  late img.Image _image;
  late Uint8List _preview;

  @override
  void initState() {
    super.initState();
    final decoded = img.decodeImage(widget.originalBytes);
    _image = decoded ??
        img.Image.fromBytes(width: 1, height: 1, bytes: Uint8List(4).buffer);
    _preview = Uint8List.fromList(img.encodePng(_image));
  }

  void _updatePreview() {
    setState(() {
      _preview = Uint8List.fromList(img.encodePng(_image));
    });
  }

  void _rotateRight() {
    _image = img.copyRotate(_image, angle: 90);
    _updatePreview();
  }

  void _rotateLeft() {
    _image = img.copyRotate(_image, angle: -90);
    _updatePreview();
  }

  void _flipHorizontal() {
    _image = img.flipHorizontal(_image);
    _updatePreview();
  }

  void _flipVertical() {
    _image = img.flipVertical(_image);
    _updatePreview();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const AppLogo(),
        actions: [
          IconButton(
            icon: const Icon(Icons.check),
            onPressed: () => Navigator.of(context)
                .pop<Uint8List>(Uint8List.fromList(img.encodePng(_image))),
          )
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: Center(
              child: Image.memory(_preview, fit: BoxFit.contain),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  IconButton(
                      onPressed: _rotateLeft,
                      icon: const Icon(Icons.rotate_left)),
                  IconButton(
                      onPressed: _rotateRight,
                      icon: const Icon(Icons.rotate_right)),
                  IconButton(
                      onPressed: _flipHorizontal, icon: const Icon(Icons.flip)),
                  IconButton(
                      onPressed: _flipVertical,
                      icon: const Icon(Icons.flip_camera_android)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
