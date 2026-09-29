import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AiService {
  static const String _baseUrlKey = 'server_url';
  static const String _defaultBase = 'http://localhost:8787';

  Future<String> get _baseUrl async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_baseUrlKey) ?? _defaultBase;
  }

  /// Stream AI response chunks (SSE / chunked)
  Stream<String> streamChat({
    required String token,
    required String message,
    required String modelId,
    required String provider,
    List<Map<String, String>> history = const [],
  }) async* {
    final base = await _baseUrl;
    final request = http.Request(
      'POST',
      Uri.parse('$base/api/ai/chat'),
    )
      ..headers['Content-Type']  = 'application/json'
      ..headers['Authorization'] = 'Bearer $token'
      ..body = jsonEncode({
        'message': message,
        'modelId': modelId,
        'provider': provider,
        'history': history,
      });

    final client = http.Client();
    try {
      final response = await client.send(request);
      await for (final chunk in response.stream.transform(utf8.decoder)) {
        // Parse SSE lines
        for (final line in chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            final data = line.substring(6).trim();
            if (data == '[DONE]') return;
            try {
              final json = jsonDecode(data) as Map<String, dynamic>;
              final delta = json['choices']?[0]?['delta']?['content'] as String?;
              if (delta != null && delta.isNotEmpty) yield delta;
            } catch (_) {}
          }
        }
      }
    } finally {
      client.close();
    }
  }

  /// Get available models
  Future<List<Map<String, dynamic>>> getModels(String token) async {
    final base = await _baseUrl;
    try {
      final res = await http.get(
        Uri.parse('$base/api/ai/models'),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 10));
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true) {
        return (body['data'] as List).cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    return [];
  }

  /// Get token usage stats
  Future<Map<String, dynamic>> getUsageStats(String token) async {
    final base = await _baseUrl;
    try {
      final res = await http.get(
        Uri.parse('$base/api/usage/stats'),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 10));
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      return body['success'] == true ? (body['data'] as Map<String, dynamic>? ?? {}) : {};
    } catch (_) {
      return {};
    }
  }
}
