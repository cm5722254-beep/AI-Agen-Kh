import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_provider.dart';
import '../services/ai_service.dart';

class UsageScreen extends StatefulWidget {
  const UsageScreen({super.key});

  @override
  State<UsageScreen> createState() => _UsageScreenState();
}

class _UsageScreenState extends State<UsageScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final app = context.read<AppProvider>();
    final ai  = context.read<AiService>();
    final stats = await ai.getUsageStats(app.user?.token ?? '');
    if (mounted) setState(() { _stats = stats; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async { setState(() => _loading = true); await _loadStats(); },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Token Usage ខែនេះ',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: scheme.primary),
                    ),
                    const SizedBox(height: 16),

                    _StatCard(
                      icon: Icons.token,
                      label: 'Total Tokens',
                      value: _fmt(_stats?['totalTokens']),
                      color: const Color(0xFF6C63FF),
                    ),
                    _StatCard(
                      icon: Icons.arrow_upward,
                      label: 'Input Tokens',
                      value: _fmt(_stats?['inputTokens']),
                      color: const Color(0xFF00D4FF),
                    ),
                    _StatCard(
                      icon: Icons.arrow_downward,
                      label: 'Output Tokens',
                      value: _fmt(_stats?['outputTokens']),
                      color: const Color(0xFF00C896),
                    ),
                    _StatCard(
                      icon: Icons.receipt_long,
                      label: 'Total Requests',
                      value: _fmt(_stats?['totalRequests']),
                      color: const Color(0xFFFF6B6B),
                    ),
                    _StatCard(
                      icon: Icons.attach_money,
                      label: 'Est. Cost (USD)',
                      value: '\$${(_stats?['estimatedCost'] ?? 0.0).toStringAsFixed(4)}',
                      color: const Color(0xFFFFD93D),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  String _fmt(dynamic val) {
    if (val == null) return '0';
    final n = (val as num).toInt();
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toString();
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(label, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 14)),
          ),
          Text(
            value,
            style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
