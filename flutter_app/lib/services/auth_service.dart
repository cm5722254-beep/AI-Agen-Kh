import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// AuthService handles login/register/logout via HTTP
/// to a local or remote Khmer AI backend API.
class AuthService {
  static const String _tokenKey = 'auth_token';
  static const String _baseUrlKey = 'server_url';
  static const String _defaultBase = 'http://localhost:8787';

  Future<String> get _baseUrl async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_baseUrlKey) ?? _defaultBase;
  }

  Future<String?> getSavedToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final base = await _baseUrl;
    try {
      final res = await http.post(
        Uri.parse('$base/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 15));

      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['token'] != null) {
        await saveToken(body['token'] as String);
      }
      return body;
    } catch (e) {
      return {'success': false, 'message': 'Cannot connect to server: $e'};
    }
  }

  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    final base = await _baseUrl;
    try {
      final res = await http.post(
        Uri.parse('$base/api/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'name': name, 'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 15));
      return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'message': 'Cannot connect to server: $e'};
    }
  }

  Future<void> logout(String token) async {
    final base = await _baseUrl;
    try {
      await http.post(
        Uri.parse('$base/api/auth/logout'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 10));
    } catch (_) {}
    await clearToken();
  }

  Future<Map<String, dynamic>?> validateSession(String token) async {
    final base = await _baseUrl;
    try {
      final res = await http.get(
        Uri.parse('$base/api/auth/me'),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 10));
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      return body['success'] == true ? body['data'] as Map<String, dynamic>? : null;
    } catch (_) {
      return null;
    }
  }
}
