import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_provider.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _nameCtrl     = TextEditingController();
  final _serverCtrl   = TextEditingController(text: 'http://localhost:8787');
  final _formKey      = GlobalKey<FormState>();

  bool _isRegister  = false;
  bool _obscurePw   = true;
  bool _loading     = false;
  String? _error;

  late AnimationController _anim;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _slide = Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero)
        .animate(CurvedAnimation(parent: _anim, curve: Curves.easeOut));
    _anim.forward();
  }

  @override
  void dispose() {
    _anim.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _nameCtrl.dispose();
    _serverCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });

    final auth = context.read<AuthService>();
    final app  = context.read<AppProvider>();

    app.setServerUrl(_serverCtrl.text.trim());

    Map<String, dynamic> result;
    if (_isRegister) {
      result = await auth.register(_nameCtrl.text.trim(), _emailCtrl.text.trim(), _passwordCtrl.text);
    } else {
      result = await auth.login(_emailCtrl.text.trim(), _passwordCtrl.text);
    }

    if (!mounted) return;
    setState(() => _loading = false);

    if (result['success'] == true) {
      final userData = result['user'] as Map<String, dynamic>?;
      final token    = result['token'] as String?;
      if (userData != null && token != null) {
        app.setUser(AppUser.fromJson(userData, token: token));
        Navigator.pushReplacementNamed(context, '/main');
      }
    } else {
      setState(() => _error = result['message'] as String? ?? 'Login failed');
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: SlideTransition(
              position: _slide,
              child: FadeTransition(
                opacity: _anim,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo
                    const Text('🇰🇭', style: TextStyle(fontSize: 64)),
                    const SizedBox(height: 12),
                    Text(
                      'Khmer AI Agent',
                      style: TextStyle(
                        fontSize: 26, fontWeight: FontWeight.bold,
                        color: scheme.primary,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _isRegister ? 'បង្កើតគណនី' : 'ចូលប្រើប្រាស់',
                      style: TextStyle(color: Colors.white.withOpacity(0.55), fontSize: 14),
                    ),
                    const SizedBox(height: 32),

                    // Form card
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1A1A2E),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF2A2A4E)),
                        boxShadow: [
                          BoxShadow(
                            color: scheme.primary.withOpacity(0.1),
                            blurRadius: 30,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Server URL
                            TextFormField(
                              controller: _serverCtrl,
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                              decoration: const InputDecoration(
                                labelText: 'Server URL',
                                prefixIcon: Icon(Icons.dns_outlined),
                                hintText: 'http://localhost:8787',
                              ),
                            ),
                            const SizedBox(height: 16),

                            if (_isRegister) ...[
                              TextFormField(
                                controller: _nameCtrl,
                                style: const TextStyle(color: Colors.white),
                                decoration: const InputDecoration(
                                  labelText: 'ឈ្មោះ (Name)',
                                  prefixIcon: Icon(Icons.person_outline),
                                ),
                                validator: (v) => v == null || v.trim().length < 2 ? 'ឈ្មោះត្រូវ 2+ តួ' : null,
                              ),
                              const SizedBox(height: 16),
                            ],

                            TextFormField(
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              style: const TextStyle(color: Colors.white),
                              decoration: const InputDecoration(
                                labelText: 'អ៊ីម៉ែល (Email)',
                                prefixIcon: Icon(Icons.email_outlined),
                              ),
                              validator: (v) => v != null && v.contains('@') ? null : 'អ៊ីម៉ែលមិនត្រឹមត្រូវ',
                            ),
                            const SizedBox(height: 16),

                            TextFormField(
                              controller: _passwordCtrl,
                              obscureText: _obscurePw,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                labelText: 'ពាក្យសម្ងាត់ (Password)',
                                prefixIcon: const Icon(Icons.lock_outline),
                                suffixIcon: IconButton(
                                  icon: Icon(_obscurePw ? Icons.visibility_off : Icons.visibility),
                                  onPressed: () => setState(() => _obscurePw = !_obscurePw),
                                ),
                              ),
                              validator: (v) => v != null && v.length >= 8 ? null : 'ត្រូវការ 8+ តួ',
                            ),

                            if (_error != null) ...[
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.red.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: Colors.red.withOpacity(0.3)),
                                ),
                                child: Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
                              ),
                            ],

                            const SizedBox(height: 24),
                            ElevatedButton(
                              onPressed: _loading ? null : _submit,
                              child: _loading
                                  ? const SizedBox(
                                      width: 20, height: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : Text(_isRegister ? 'បង្កើតគណនី' : 'ចូល'),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),
                    TextButton(
                      onPressed: () => setState(() { _isRegister = !_isRegister; _error = null; }),
                      child: Text(
                        _isRegister ? 'មានគណនីរួចហើយ? ចូល' : 'មិនទាន់មានគណនី? ចុះឈ្មោះ',
                        style: TextStyle(color: scheme.primary),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
