class LinkPreview {
  final String url;
  final String? finalUrl;
  final String? title;
  final String? description;
  final String? image;
  final String? siteName;

  LinkPreview({
    required this.url,
    this.finalUrl,
    this.title,
    this.description,
    this.image,
    this.siteName,
  });

  factory LinkPreview.fromJson(Map<String, dynamic> json) {
    final data = (json['data'] ?? json) as Map<String, dynamic>? ?? json;
    return LinkPreview(
      url: (data['url'] as String?) ?? '',
      finalUrl: data['finalUrl'] as String?,
      title: data['title'] as String?,
      description: data['description'] as String?,
      image: data['image'] as String?,
      siteName: data['siteName'] as String?,
    );
  }
}
