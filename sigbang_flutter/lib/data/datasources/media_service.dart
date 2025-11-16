import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'api_client.dart';

class MediaService {
  final ApiClient _apiClient;

  MediaService(this._apiClient);

  Future<({String uploadUrl, String path})> presign(String contentType) async {
    final response = await _apiClient.dio.post(
      '/media/presign',
      data: {'contentType': contentType},
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = response.data is Map<String, dynamic>
          ? response.data
          : (response.data['data'] ?? response.data);
      final uploadUrl = (data['uploadUrl'] ?? data['url']) as String;
      final path = (data['path'] ?? data['key']) as String;
      return (uploadUrl: uploadUrl, path: path);
    }
    throw Exception('Presign failed: ${response.statusCode}');
  }

  Future<void> uploadBytes(
    String uploadUrl,
    Uint8List bytes,
    String contentType,
  ) async {
    // Use a bare Dio without interceptors for presigned PUTs
    final dio = Dio();
    await dio.put(
      uploadUrl,
      // Send as a single contiguous buffer for performance
      data: bytes,
      options: Options(
        headers: {'Content-Type': contentType},
        followRedirects: false,
        validateStatus: (code) => code != null && code >= 200 && code < 400,
      ),
    );
  }
}
