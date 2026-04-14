import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutterapp/demo_parameters.dart';
import 'package:flutterapp/launch_darkly_scope.dart';
import 'package:flutterapp/models/conference_room.dart';
import 'package:flutterapp/models/desk.dart';
import 'package:flutterapp/models/office.dart';
import 'package:flutterapp/services/context_service.dart';
import 'package:flutterapp/services/reservation_service.dart';
import 'package:flutterapp/services/user_service.dart';
import 'package:launchdarkly_flutter_client_sdk/launchdarkly_flutter_client_sdk.dart';

class ReservationPage extends StatefulWidget {
  const ReservationPage({super.key});

  @override
  State<ReservationPage> createState() => _ReservationPageState();
}

class _ReservationPageState extends State<ReservationPage> {
  static const _primary = Color(0xFF512BD4);

  final List<Office> _offices = Office.getOffices();
  late String _currentOfficeId;
  int _officeIndex = 0;
  bool _showDesks = true;
  StreamSubscription<FlagsChangedEvent>? _flagSub;

  List<Desk> _desks = [];
  List<ConferenceRoom> _rooms = [];
  List<ReservationRow> _myRows = [];

  @override
  void initState() {
    super.initState();
    ReservationService.ensureInitialized();
    _currentOfficeId = 'la';
    _officeIndex = _offices.indexWhere((o) => o.id == _currentOfficeId);
    if (_officeIndex < 0) _officeIndex = 0;
    _loadDesksAndRoomsOnly();

    // LaunchDarklyScope.of(context) is not valid in initState — defer LD-dependent work.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _rebuildMyReservations();
      final client = LaunchDarklyScope.of(context);
      _flagSub = client.flagChanges.listen((e) {
        if (e.keys.contains(DemoParameters.hotelingFlagKey) && mounted) {
          setState(() => _reloadLists());
        }
      });
      _updateLdContextForOffice();
    });
  }

  @override
  void dispose() {
    _flagSub?.cancel();
    super.dispose();
  }

  bool get _hotelingEnabled {
    final c = LaunchDarklyScope.of(context);
    if (!c.initialized) return false;
    return c.boolVariation(DemoParameters.hotelingFlagKey, false);
  }

  void _loadDesksAndRoomsOnly() {
    _desks = List.from(ReservationService.getDesks(_currentOfficeId));
    _rooms = List.from(ReservationService.getConferenceRooms(_currentOfficeId));
  }

  void _reloadLists() {
    _loadDesksAndRoomsOnly();
    _rebuildMyReservations();
  }

  void _rebuildMyReservations() {
    final userId = UserService.currentUser ?? 'Unknown';
    final raw = ReservationService.getUserReservations(userId);
    final hoteling = _hotelingEnabled;
    final filtered = hoteling ? raw : raw.where((r) => r.deskId != null && r.deskId!.isNotEmpty).toList();

    _myRows = filtered.map((r) {
      String? deskName;
      if (r.deskId != null) {
        final di = _desks.indexWhere((d) => d.id == r.deskId);
        if (di >= 0) deskName = _desks[di].name;
      }
      String? roomName;
      if (r.conferenceRoomId != null) {
        final ri = _rooms.indexWhere((x) => x.id == r.conferenceRoomId);
        if (ri >= 0) roomName = _rooms[ri].name;
      }
      final resource = deskName ?? roomName ?? (r.deskId != null ? 'Desk' : 'Room');
      var officeName = 'Unknown';
      for (final o in _offices) {
        if (o.id == r.officeId) {
          officeName = o.name;
          break;
        }
      }
      return ReservationRow(
        id: r.id,
        resourceName: resource,
        officeName: officeName,
        reservedUntil: r.reservedUntil,
      );
    }).toList();
    setState(() {});
  }

  Future<void> _updateLdContextForOffice() async {
    final user = UserService.currentUser;
    if (user == null || user.isEmpty) return;

    final client = LaunchDarklyScope.of(context);
    if (!client.initialized) return;

    final office = _offices[_officeIndex];
    final officeKey = '${office.name.toLowerCase().replaceAll(' ', '-')}-key';

    try {
      final b = LDContextBuilder();
      b.kind('user', '$user-key').name(user);
      b.kind('office', officeKey).setString('location', office.name);
      final ctx = b.build();

      await client.identify(ctx);
      ContextService.currentUser = user;
      ContextService.currentOffice = office.name;
      if (mounted) setState(() {});
    } catch (_) {
      /* keep UX flowing */
    }
  }

  Future<void> _onOfficeChanged(int? index) async {
    if (index == null || index < 0 || index >= _offices.length) return;
    setState(() {
      _officeIndex = index;
      _currentOfficeId = _offices[index].id;
      _loadDesksAndRoomsOnly();
      _rebuildMyReservations();
    });
    await _updateLdContextForOffice();
  }

  Future<void> _reserveDesk(String deskId) async {
    final userId = UserService.currentUser ?? 'Unknown';
    if (!mounted) return;
    final choice = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(title: const Text('Reserve for 1 day'), onTap: () => Navigator.pop(ctx, '1d')),
            ListTile(title: const Text('Reserve for 3 days'), onTap: () => Navigator.pop(ctx, '3d')),
            ListTile(title: const Text('Reserve for 1 week'), onTap: () => Navigator.pop(ctx, '1w')),
            ListTile(title: const Text('Cancel'), onTap: () => Navigator.pop(ctx)),
          ],
        ),
      ),
    );
    if (choice == null) return;
    final until = switch (choice) {
      '1d' => DateTime.now().add(const Duration(days: 1)),
      '3d' => DateTime.now().add(const Duration(days: 3)),
      '1w' => DateTime.now().add(const Duration(days: 7)),
      _ => DateTime.now().add(const Duration(days: 1)),
    };
    if (ReservationService.reserveDesk(deskId, userId, until)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Desk reserved')));
        _reloadLists();
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not reserve desk')));
    }
  }

  Future<void> _reserveRoom(String roomId) async {
    final userId = UserService.currentUser ?? 'Unknown';
    if (!mounted) return;
    final choice = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(title: const Text('Reserve for 1 hour'), onTap: () => Navigator.pop(ctx, '1h')),
            ListTile(title: const Text('Reserve for 2 hours'), onTap: () => Navigator.pop(ctx, '2h')),
            ListTile(title: const Text('Reserve for 4 hours'), onTap: () => Navigator.pop(ctx, '4h')),
            ListTile(title: const Text('Cancel'), onTap: () => Navigator.pop(ctx)),
          ],
        ),
      ),
    );
    if (choice == null) return;
    final until = switch (choice) {
      '1h' => DateTime.now().add(const Duration(hours: 1)),
      '2h' => DateTime.now().add(const Duration(hours: 2)),
      '4h' => DateTime.now().add(const Duration(hours: 4)),
      _ => DateTime.now().add(const Duration(hours: 2)),
    };
    if (ReservationService.reserveConferenceRoom(roomId, userId, until)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Room reserved')));
        _reloadLists();
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not reserve room')));
    }
  }

  Future<void> _cancelReservation(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel reservation'),
        content: const Text('Are you sure you want to cancel this reservation?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Yes')),
        ],
      ),
    );
    if (ok == true && ReservationService.cancelReservation(id)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cancelled')));
        _reloadLists();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final hoteling = _hotelingEnabled;
    if (!hoteling && !_showDesks) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _showDesks = true);
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reserve a Desk'),
        backgroundColor: _primary,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            '🏢 Office Hoteling',
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: _primary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            hoteling ? 'Reserve desks and conference rooms' : 'Reserve desks',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Select Office', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  InputDecorator(
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.grey.shade100,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<int>(
                        isExpanded: true,
                        value: _officeIndex,
                        items: List.generate(
                          _offices.length,
                          (i) => DropdownMenuItem(value: i, child: Text(_offices[i].name)),
                        ),
                        onChanged: _onOfficeChanged,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _tabButton('Desks', _showDesks, () => setState(() => _showDesks = true)),
              const SizedBox(width: 10),
              if (hoteling) _tabButton('Conference Rooms', !_showDesks, () => setState(() => _showDesks = false)),
            ],
          ),
          const SizedBox(height: 16),
          if (_showDesks) _deskSection() else _roomSection(),
          const SizedBox(height: 24),
          Card(
            color: const Color(0xFFE8E0F7),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFF3D1F7A)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('My Reservations', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: _primary)),
                  const SizedBox(height: 12),
                  if (_myRows.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(8),
                      child: Center(child: Text('No active reservations')),
                    )
                  else
                    ..._myRows.map((row) => _reservationTile(row)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _tabButton(String label, bool selected, VoidCallback onTap) {
    return FilledButton.tonal(
      onPressed: onTap,
      style: FilledButton.styleFrom(
        backgroundColor: selected ? _primary : Colors.grey.shade300,
        foregroundColor: selected ? Colors.white : Colors.black87,
      ),
      child: Text(label),
    );
  }

  Widget _deskSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Available Desks', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ..._desks.map(_deskTile),
          ],
        ),
      ),
    );
  }

  Widget _deskTile(Desk d) {
    final border = d.isReserved ? Colors.red.shade400 : Colors.green.shade600;
    final bg = d.isReserved ? Colors.red.shade50 : Colors.green.shade50;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(d.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(d.isReserved ? 'Reserved' : 'Available', style: TextStyle(color: border, fontSize: 12)),
                if (d.isReserved && d.reservedBy != null)
                  Text('Reserved by: ${d.reservedBy}', style: TextStyle(fontSize: 11, color: Colors.grey.shade700)),
              ],
            ),
          ),
          FilledButton(
            onPressed: d.isReserved ? null : () => _reserveDesk(d.id),
            child: Text(d.isReserved ? 'Reserved' : 'Reserve'),
          ),
        ],
      ),
    );
  }

  Widget _roomSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Conference Rooms', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ..._rooms.map(_roomTile),
          ],
        ),
      ),
    );
  }

  Widget _roomTile(ConferenceRoom r) {
    final border = r.isReserved ? Colors.red.shade400 : Colors.green.shade600;
    final bg = r.isReserved ? Colors.red.shade50 : Colors.green.shade50;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text('Capacity: ${r.capacity} people', style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                Text(r.isReserved ? 'Reserved' : 'Available', style: TextStyle(color: border, fontSize: 12)),
                if (r.isReserved && r.reservedBy != null)
                  Text('Reserved by: ${r.reservedBy}', style: TextStyle(fontSize: 11, color: Colors.grey.shade700)),
              ],
            ),
          ),
          FilledButton(
            onPressed: r.isReserved ? null : () => _reserveRoom(r.id),
            child: Text(r.isReserved ? 'Reserved' : 'Reserve'),
          ),
        ],
      ),
    );
  }

  Widget _reservationTile(ReservationRow row) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(row.resourceName, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('${row.officeName}\nUntil: ${row.reservedUntil.toLocal()}'),
        isThreeLine: true,
        trailing: FilledButton(
          onPressed: () => _cancelReservation(row.id),
          style: FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
          child: const Text('Cancel'),
        ),
      ),
    );
  }
}

class ReservationRow {
  ReservationRow({
    required this.id,
    required this.resourceName,
    required this.officeName,
    required this.reservedUntil,
  });

  final String id;
  final String resourceName;
  final String officeName;
  final DateTime reservedUntil;
}
