import 'package:flutterapp/models/conference_room.dart';
import 'package:flutterapp/models/desk.dart';
import 'package:flutterapp/models/reservation.dart';
import 'package:uuid/uuid.dart';

class ReservationService {
  ReservationService._();

  static const _uuid = Uuid();

  static final List<Desk> _desks = [];
  static final List<ConferenceRoom> _rooms = [];
  static final List<Reservation> _reservations = [];
  static String _currentOfficeId = 'la';

  static String get currentOfficeId => _currentOfficeId;

  static set currentOfficeId(String value) {
    _currentOfficeId = value;
    _initializeOfficeData(value);
  }

  static void _initializeOfficeData(String officeId) {
    _desks.clear();
    for (var i = 1; i <= 20; i++) {
      _desks.add(Desk(
        id: '$officeId-desk-$i',
        name: 'Desk $i',
        officeId: officeId,
      ));
    }

    _rooms.clear();
    final roomNames = switch (officeId) {
      'la' => ['Broadway', 'Spring', 'Grand', 'Figueroa', 'Bunker Hill'],
      'burbank' => ['Warner', 'Disney', 'Universal', 'Media District', 'Toluca Lake'],
      'glendale' => ['Brand', 'Central', 'Verdugo', 'Chevy Chase', 'Montrose'],
      'losfeliz' => ['Griffith', 'Fern Dell', 'Vista', 'Franklin', 'Los Feliz Blvd'],
      'hollywood' => ['Walk of Fame', 'Sunset Strip', 'Vine', 'Highland', 'Cahuenga'],
      _ => ['Pacific', 'Sunset', 'Hollywood', 'Vine', 'Wilshire'],
    };

    for (var i = 0; i < roomNames.length; i++) {
      _rooms.add(ConferenceRoom(
        id: '$officeId-room-${i + 1}',
        name: roomNames[i],
        officeId: officeId,
        capacity: (i + 1) * 4,
      ));
    }

    _updateReservationStatus();
  }

  static void ensureInitialized() {
    if (_desks.isEmpty) {
      _initializeOfficeData(_currentOfficeId);
    }
  }

  static List<Desk> getDesks(String officeId) {
    if (officeId != _currentOfficeId) {
      currentOfficeId = officeId;
    }
    return List.unmodifiable(_desks);
  }

  static List<ConferenceRoom> getConferenceRooms(String officeId) {
    if (officeId != _currentOfficeId) {
      currentOfficeId = officeId;
    }
    return List.unmodifiable(_rooms);
  }

  static bool reserveDesk(String deskId, String userId, DateTime reservedUntil) {
    final i = _desks.indexWhere((d) => d.id == deskId);
    if (i < 0) return false;
    final desk = _desks[i];
    if (desk.isReserved) return false;

    desk
      ..isReserved = true
      ..reservedBy = userId
      ..reservedUntil = reservedUntil;

    _reservations.add(Reservation(
      id: _uuid.v4(),
      userId: userId,
      officeId: desk.officeId,
      deskId: deskId,
      reservedAt: DateTime.now(),
      reservedUntil: reservedUntil,
    ));
    return true;
  }

  static bool reserveConferenceRoom(String roomId, String userId, DateTime reservedUntil) {
    final i = _rooms.indexWhere((r) => r.id == roomId);
    if (i < 0) return false;
    final room = _rooms[i];
    if (room.isReserved) return false;

    room
      ..isReserved = true
      ..reservedBy = userId
      ..reservedUntil = reservedUntil;

    _reservations.add(Reservation(
      id: _uuid.v4(),
      userId: userId,
      officeId: room.officeId,
      conferenceRoomId: roomId,
      reservedAt: DateTime.now(),
      reservedUntil: reservedUntil,
    ));
    return true;
  }

  static bool cancelReservation(String reservationId) {
    final i = _reservations.indexWhere((r) => r.id == reservationId);
    if (i < 0) return false;
    final reservation = _reservations[i];

    reservation.isActive = false;

    final deskId = reservation.deskId;
    if (deskId != null && deskId.isNotEmpty) {
      final di = _desks.indexWhere((d) => d.id == deskId);
      if (di >= 0) {
        final desk = _desks[di];
        desk
          ..isReserved = false
          ..reservedBy = null
          ..reservedUntil = null;
      }
    }

    final confId = reservation.conferenceRoomId;
    if (confId != null && confId.isNotEmpty) {
      final ri = _rooms.indexWhere((r) => r.id == confId);
      if (ri >= 0) {
        final room = _rooms[ri];
        room
          ..isReserved = false
          ..reservedBy = null
          ..reservedUntil = null;
      }
    }

    return true;
  }

  static List<Reservation> getUserReservations(String userId) {
    return _reservations.where((r) => r.userId == userId && r.isActive).toList();
  }

  static void _updateReservationStatus() {
    final now = DateTime.now();
    final activeReservations = _reservations.where((r) => r.isActive && r.reservedUntil.isAfter(now)).toList();

    for (final desk in _desks) {
      desk
        ..isReserved = false
        ..reservedBy = null
        ..reservedUntil = null;
    }

    for (final room in _rooms) {
      room
        ..isReserved = false
        ..reservedBy = null
        ..reservedUntil = null;
    }

    for (final reservation in activeReservations) {
      final dId = reservation.deskId;
      if (dId != null && dId.isNotEmpty) {
        final di = _desks.indexWhere((d) => d.id == dId);
        if (di >= 0) {
          final desk = _desks[di];
          desk
            ..isReserved = true
            ..reservedBy = reservation.userId
            ..reservedUntil = reservation.reservedUntil;
        }
      }

      final cId = reservation.conferenceRoomId;
      if (cId != null && cId.isNotEmpty) {
        final ri = _rooms.indexWhere((r) => r.id == cId);
        if (ri >= 0) {
          final room = _rooms[ri];
          room
            ..isReserved = true
            ..reservedBy = reservation.userId
            ..reservedUntil = reservation.reservedUntil;
        }
      }
    }

    for (final reservation in _reservations.where((r) => r.isActive && !r.reservedUntil.isAfter(now))) {
      reservation.isActive = false;
    }
  }
}
