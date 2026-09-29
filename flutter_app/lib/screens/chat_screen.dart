import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';

import '../providers/app_provider.dart';
import '../services/ai_service.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _inputCtrl   = TextEditingController();
  final _scrollCtrl  = ScrollController();
  StreamSubscription? _streamSub;

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    _streamSub?.cancel();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty) return;

    final app = context.read<AppProvider>();
    final ai  = context.read<AiService>();

    _inputCtrl.clear();
    app.addMessage(ChatMessage(role: 'user', content: text, timestamp: DateTime.now()));
    app.setStreaming(true);
    _scrollToBottom();

    final history = app.chatHistory
        .map((m) => {'role': m.role, 'content': m.content})
        .toList();

    try {
      final stream = ai.streamChat(
        token:    app.user?.token ?? '',
        message:  text,
        modelId:  app.selectedModelId,
        provider: app.selectedProvider,
        history:  history,
      );

      await for (final delta in stream) {
        app.appendToLastAssistant(delta);
        _scrollToBottom();
      }
    } catch (e) {
      app.appendToLastAssistant('\n\n⚠️ Error: $e');
    } finally {
      app.setStreaming(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app    = context.watch<AppProvider>();
    final scheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        // Chat messages
        Expanded(
          child: app.chatHistory.isEmpty
              ? _buildEmpty(scheme)
              : ListView.builder(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: app.chatHistory.length,
                  itemBuilder: (_, i) => _ChatBubble(msg: app.chatHistory[i]),
                ),
        ),

        // Input bar
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A2E),
            border: Border(top: BorderSide(color: const Color(0xFF2A2A4E))),
          ),
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                // Clear button
                if (app.chatHistory.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.clear_all, size: 20),
                    onPressed: app.clearChat,
                    tooltip: 'Clear chat',
                    color: Colors.grey,
                  ),
                Expanded(
                  child: TextField(
                    controller: _inputCtrl,
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _send(),
                    decoration: InputDecoration(
                      hintText: 'សួរ AI... (Ask AI...)',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      isDense: true,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  child: FloatingActionButton.small(
                    onPressed: app.streaming ? null : _send,
                    backgroundColor: scheme.primary,
                    child: app.streaming
                        ? const SizedBox(
                            width: 16, height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.send, size: 18),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmpty(ColorScheme scheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.smart_toy_outlined, size: 72, color: scheme.primary.withOpacity(0.3)),
          const SizedBox(height: 16),
          Text(
            'ចាប់ផ្តើម Chat ជាមួយ AI',
            style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            'Ask anything about coding!',
            style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 13),
          ),
        ],
      ),
    );
  }
}

// ignore_for_file: must_be_immutable
import 'dart:async';

class _ChatBubble extends StatelessWidget {
  final ChatMessage msg;
  const _ChatBubble({required this.msg});

  @override
  Widget build(BuildContext context) {
    final isUser = msg.role == 'user';
    final scheme = Theme.of(context).colorScheme;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: GestureDetector(
        onLongPress: () {
          Clipboard.setData(ClipboardData(text: msg.content));
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Copied!'), duration: Duration(seconds: 1)),
          );
        },
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 4),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.82,
          ),
          decoration: BoxDecoration(
            color: isUser
                ? scheme.primary.withOpacity(0.85)
                : const Color(0xFF252545),
            borderRadius: BorderRadius.only(
              topLeft:     const Radius.circular(16),
              topRight:    const Radius.circular(16),
              bottomLeft:  Radius.circular(isUser ? 16 : 4),
              bottomRight: Radius.circular(isUser ? 4 : 16),
            ),
          ),
          child: Text(
            msg.content,
            style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.5),
          ),
        ),
      ),
    );
  }
}
