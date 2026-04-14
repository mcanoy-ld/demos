class Desk {
  Desk({
    required this.id,
    required this.name,
    required this.officeId,
    this.isReserved = false,
    this.reservedBy,
    this.reservedUntil,
  });

  final String id;
  final String name;
  final String officeId;
  bool isReserved;
  String? reservedBy;
  DateTime? reservedUntil;
}
