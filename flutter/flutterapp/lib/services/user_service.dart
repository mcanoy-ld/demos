class UserService {
  UserService._();

  static String? currentUser;

  static String getInitial() {
    final u = currentUser;
    if (u == null || u.isEmpty) return '?';
    return u.substring(0, 1).toUpperCase();
  }
}
