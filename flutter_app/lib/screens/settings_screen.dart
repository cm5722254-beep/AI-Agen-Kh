import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../providers/app_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _serverCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _serverCtrl.text = prefs.getString('server_url') ?? 'http://localhost:8787';
  }

  Future<void> _saveServerUrl() async {
    final url = _serverCtrl.text.trim();
    if (url.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('server_url', url);
    context.read<AppProvider>().setServerUrl(url);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('✅ Server URL saved'), backgroundColor: Color(0xFF1A1A2E)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app    = context.watch<AppProvider>();
    final scheme = Theme.of(context).colorScheme;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // User info
          if (app.user != null) ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A2E),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF2A2A4E)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: scheme.primary.withOpacity(0.2),
                    child: Text(
                      app.user!.name[0].toUpperCase(),
                      style: TextStyle(fontSize: 22, color: scheme.primary, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(app.user!.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 2),
                        Text(app.user!.email, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13)),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: scheme.primary.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            app.user!.role,
                            style: TextStyle(color: scheme.primary, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          // Server URL
          Text('Server Connection', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: scheme.primary)),
          const SizedBox(height: 12),
          TextFormField(
            controller: _serverCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              labelText: 'Server URL',
              prefixIcon: Icon(Icons.dns_outlined),
              hintText: 'http://192.168.x.x:8787',
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: _saveServerUrl,
            icon: const Icon(Icons.save, size: 18),
            label: const Text('Save Server URL'),
          ),
          const SizedBox(height: 8),
          Text(
            '💡 To connect from mobile, set the IP of your PC running Khmer AI',
            style: TextStyle(color: Colors.white.withOpacity(0.45), fontSize: 12),
          ),

          const SizedBox(height: 28),
          Text('About', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: scheme.primary)),
          const SizedBox(height: 12),
          _AboutTile(icon: '🇰🇭', label: 'App', value: 'Khmer AI Agent v1.0.0'),
          _AboutTile(icon: '📱', label: 'Platform', value: 'Flutter (Android & iOS)'),
          _AboutTile(icon: '🔐', label: 'Security', value: 'scrypt + AES-256-GCM'),
          _AboutTile(icon: '📄', label: 'License', value: 'MIT — Khmer AI Team'),
        ],
      ),
    );
  }
}

class _AboutTile extends StatelessWidget {
  final String icon;
  final String label;
  final String value;

  const _AboutTile({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: TextStyle(color: Colors.white.withOpacity(0.6)))),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
