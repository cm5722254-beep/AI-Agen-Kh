import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_provider.dart';
import '../services/auth_service.dart';
import 'chat_screen.dart';
import 'usage_screen.dart';
import 'settings_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _tab = 0;

  final List<Widget> _tabs = const [
    ChatScreen(),
    UsageScreen(),
    SettingsScreen(),
  ];

  Future<void> _logout() async {
    final app  = context.read<AppProvider>();
    final auth = context.read<AuthService>();
    final token = app.user?.token;
    if (token != null) await auth.logout(token);
    app.logout();
    if (mounted) Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    final app    = context.watch<AppProvider>();
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('🇰🇭 ', style: TextStyle(fontSize: 20)),
            const Text(
              'Khmer AI',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          if (app.user != null)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: PopupMenuButton<String>(
                offset: const Offset(0, 48),
                child: CircleAvatar(
                  backgroundColor: scheme.primary.withOpacity(0.2),
                  radius: 18,
                  child: Text(
                    app.user!.name.isNotEmpty ? app.user!.name[0].toUpperCase() : '?',
                    style: TextStyle(color: scheme.primary, fontWeight: FontWeight.bold),
                  ),
                ),
                itemBuilder: (_) => [
                  PopupMenuItem(
                    enabled: false,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(app.user!.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        Text(app.user!.email, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        Text(app.user!.role, style: TextStyle(fontSize: 11, color: scheme.primary)),
                      ],
                    ),
                  ),
                  const PopupMenuDivider(),
                  const PopupMenuItem(value: 'logout', child: Row(
                    children: [Icon(Icons.logout, size: 18), SizedBox(width: 8), Text('ចេញ (Logout)')],
                  )),
                ],
                onSelected: (v) { if (v == 'logout') _logout(); },
              ),
            ),
        ],
      ),
      body: IndexedStack(index: _tab, children: _tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        backgroundColor: const Color(0xFF1A1A2E),
        indicatorColor: scheme.primary.withOpacity(0.2),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.smart_toy_outlined),
            selectedIcon: Icon(Icons.smart_toy),
            label: 'AI Chat',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart),
            label: 'Usage',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
