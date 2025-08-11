import 'dart:typed_data';
import 'package:crop_your_image/crop_your_image.dart';
import 'package:flutter/material.dart';

class SquareCropPage extends StatefulWidget {
  final Uint8List imageBytes;
  final double initialAspectRatio; // default 1:1
  const SquareCropPage(
      {super.key, required this.imageBytes, this.initialAspectRatio = 1.0});

  @override
  State<SquareCropPage> createState() => _SquareCropPageState();
}

class _SquareCropPageState extends State<SquareCropPage> {
  final CropController _controller = CropController();
  bool _isCropping = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(''),
        actions: [
          IconButton(
            onPressed: _isCropping
                ? null
                : () {
                    setState(() => _isCropping = true);
                    _controller.crop();
                  },
            icon: const Icon(Icons.check),
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final double size = constraints.maxWidth < constraints.maxHeight
              ? constraints.maxWidth
              : constraints.maxHeight;
          return Stack(
            children: [
              Center(
                child: SizedBox(
                  width: size,
                  height: size,
                  child: Crop(
                    controller: _controller,
                    image: widget.imageBytes,
                    onCropped: (Uint8List croppedBytes) {
                      if (mounted) {
                        Navigator.of(context).pop<Uint8List>(croppedBytes);
                      }
                    },
                    withCircleUi: false,
                    baseColor: Colors.black,
                    maskColor: Colors.black.withOpacity(0.5),
                    cornerDotBuilder: (size, edgeAlignment) =>
                        const SizedBox.shrink(),
                    aspectRatio: widget.initialAspectRatio,
                    interactive: true,
                    initialSize: 1.0,
                  ),
                ),
              ),
              if (_isCropping)
                const Positioned.fill(
                  child: ColoredBox(
                    color: Color(0x88000000),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
