class ContextService {
  ContextService._();

  static String? currentOffice;
  static String? currentUser;

  static String getContextDisplay() {
    final parts = <String>[];
    final u = currentUser;
    if (u != null && u.isNotEmpty) {
      parts.add('User: $u');
    }
    final o = currentOffice;
    if (o != null && o.isNotEmpty) {
      parts.add('Office: $o');
    }
    return parts.isNotEmpty ? parts.join(' | ') : 'No context';
  }
}
