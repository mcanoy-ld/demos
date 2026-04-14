class Office {
  const Office({required this.id, required this.name});

  final String id;
  final String name;

  static List<Office> getOffices() {
    return const [
      Office(id: 'la', name: 'Los Angeles'),
      Office(id: 'burbank', name: 'Burbank'),
      Office(id: 'glendale', name: 'Glendale'),
      Office(id: 'losfeliz', name: 'Los Feliz'),
      Office(id: 'hollywood', name: 'Hollywood'),
    ];
  }
}
