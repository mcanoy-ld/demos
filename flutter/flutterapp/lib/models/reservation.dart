class Reservation {
  Reservation({
    required this.id,
    required this.userId,
    required this.officeId,
    this.deskId,
    this.conferenceRoomId,
    required this.reservedAt,
    required this.reservedUntil,
    this.isActive = true,
  });

  final String id;
  final String userId;
  final String officeId;
  final String? deskId;
  final String? conferenceRoomId;
  final DateTime reservedAt;
  final DateTime reservedUntil;
  bool isActive;
}
