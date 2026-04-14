class ConferenceRoom {
  ConferenceRoom({
    required this.id,
    required this.name,
    required this.officeId,
    required this.capacity,
    this.isReserved = false,
    this.reservedBy,
    this.reservedUntil,
  });

  final String id;
  final String name;
  final String officeId;
  final int capacity;
  bool isReserved;
  String? reservedBy;
  DateTime? reservedUntil;
}
