import 'package:flutter/foundation.dart';

class AppUser {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? token;

  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.token,
  });

  factory AppUser.fromJson(Map<String, dynamic> json, {String? token}) {
    return AppUser(
      id:    json['id'] as String,
      name:  json['name'] as String,
      email: json['email'] as String,
      role:  json['role'] as String? ?? 'USER',
      token: token,
    );
  }

  bool get isAdmin => role == 'ADMIN' || role == 'SUPER_ADMIN';
  bool get isSuperAdmin => role == 'SUPER_ADMIN';
}

class ChatMessage {
  final String role;    // 'user' | 'assistant'
  final String content;
  final DateTime timestamp;

  ChatMessage({required this.role, required this.content, required this.timestamp});
}

class AppProvider extends ChangeNotifier {
  AppUser? _user;
  bool _loading = false;
  String? _serverUrl;
  String _selectedModelId = '';
  String _selectedProvider = 'nvidia';
  List<ChatMessage> _chatHistory = [];
  bool _streaming = false;

  // Getters
  AppUser? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get loading => _loading;
  String get serverUrl => _serverUrl ?? 'http://localhost:8787';
  String get selectedModelId => _selectedModelId;
  String get selectedProvider => _selectedProvider;
  List<ChatMessage> get chatHistory => List.unmodifiable(_chatHistory);
  bool get streaming => _streaming;

  void setUser(AppUser? user) {
    _user = user;
    notifyListeners();
  }

  void setLoading(bool val) {
    _loading = val;
    notifyListeners();
  }

  void setServerUrl(String url) {
    _serverUrl = url;
    notifyListeners();
  }

  void setModel(String modelId, String provider) {
    _selectedModelId = modelId;
    _selectedProvider = provider;
    notifyListeners();
  }

  void addMessage(ChatMessage msg) {
    _chatHistory.add(msg);
    notifyListeners();
  }

  void appendToLastAssistant(String delta) {
    if (_chatHistory.isNotEmpty && _chatHistory.last.role == 'assistant') {
      final last = _chatHistory.last;
      _chatHistory[_chatHistory.length - 1] = ChatMessage(
        role: 'assistant',
        content: last.content + delta,
        timestamp: last.timestamp,
      );
      notifyListeners();
    } else {
      _chatHistory.add(ChatMessage(
        role: 'assistant',
        content: delta,
        timestamp: DateTime.now(),
      ));
      notifyListeners();
    }
  }

  void setStreaming(bool val) {
    _streaming = val;
    notifyListeners();
  }

  void clearChat() {
    _chatHistory = [];
    notifyListeners();
  }

  void logout() {
    _user = null;
    _chatHistory = [];
    notifyListeners();
  }
}
