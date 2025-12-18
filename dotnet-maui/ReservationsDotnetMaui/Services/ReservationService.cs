using ReservationsDotnetMaui.Models;

namespace ReservationsDotnetMaui.Services;

public static class ReservationService
{
    private static List<Desk> _desks = new();
    private static List<ConferenceRoom> _rooms = new();
    private static List<Reservation> _reservations = new();
    private static string _currentOfficeId = "la"; // Default: Los Angeles

    public static string CurrentOfficeId
    {
        get => _currentOfficeId;
        set
        {
            _currentOfficeId = value;
            InitializeOfficeData(value);
        }
    }

    static ReservationService()
    {
        InitializeOfficeData(_currentOfficeId);
    }

    private static void InitializeOfficeData(string officeId)
    {
        // Initialize desks for the office
        _desks = new List<Desk>();
        for (int i = 1; i <= 20; i++)
        {
            _desks.Add(new Desk
            {
                Id = $"{officeId}-desk-{i}",
                Name = $"Desk {i}",
                OfficeId = officeId,
                IsReserved = false
            });
        }

        // Initialize conference rooms for the office with area-specific names
        _rooms = new List<ConferenceRoom>();
        string[] roomNames = officeId switch
        {
            "la" => new[] { "Broadway", "Spring", "Grand", "Figueroa", "Bunker Hill" }, // Downtown LA
            "burbank" => new[] { "Warner", "Disney", "Universal", "Media District", "Toluca Lake" }, // Burbank
            "glendale" => new[] { "Brand", "Central", "Verdugo", "Chevy Chase", "Montrose" }, // Glendale
            "losfeliz" => new[] { "Griffith", "Fern Dell", "Vista", "Franklin", "Los Feliz Blvd" }, // Los Feliz
            "hollywood" => new[] { "Walk of Fame", "Sunset Strip", "Vine", "Highland", "Cahuenga" }, // Hollywood
            _ => new[] { "Pacific", "Sunset", "Hollywood", "Vine", "Wilshire" } // Default fallback
        };
        
        for (int i = 0; i < roomNames.Length; i++)
        {
            _rooms.Add(new ConferenceRoom
            {
                Id = $"{officeId}-room-{i + 1}",
                Name = roomNames[i],
                OfficeId = officeId,
                Capacity = (i + 1) * 4, // 4, 8, 12, 16, 20
                IsReserved = false
            });
        }

        // Update reservation status based on active reservations
        UpdateReservationStatus();
    }

    public static List<Desk> GetDesks(string officeId)
    {
        if (officeId != _currentOfficeId)
        {
            CurrentOfficeId = officeId;
        }
        return _desks;
    }

    public static List<ConferenceRoom> GetConferenceRooms(string officeId)
    {
        if (officeId != _currentOfficeId)
        {
            CurrentOfficeId = officeId;
        }
        return _rooms;
    }

    public static bool ReserveDesk(string deskId, string userId, DateTime reservedUntil)
    {
        var desk = _desks.FirstOrDefault(d => d.Id == deskId);
        if (desk == null || desk.IsReserved) return false;

        desk.IsReserved = true;
        desk.ReservedBy = userId;
        desk.ReservedUntil = reservedUntil;

        var reservation = new Reservation
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            OfficeId = desk.OfficeId,
            DeskId = deskId,
            ReservedAt = DateTime.Now,
            ReservedUntil = reservedUntil,
            IsActive = true
        };

        _reservations.Add(reservation);
        return true;
    }

    public static bool ReserveConferenceRoom(string roomId, string userId, DateTime reservedUntil)
    {
        var room = _rooms.FirstOrDefault(r => r.Id == roomId);
        if (room == null || room.IsReserved) return false;

        room.IsReserved = true;
        room.ReservedBy = userId;
        room.ReservedUntil = reservedUntil;

        var reservation = new Reservation
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            OfficeId = room.OfficeId,
            ConferenceRoomId = roomId,
            ReservedAt = DateTime.Now,
            ReservedUntil = reservedUntil,
            IsActive = true
        };

        _reservations.Add(reservation);
        return true;
    }

    public static bool CancelReservation(string reservationId)
    {
        var reservation = _reservations.FirstOrDefault(r => r.Id == reservationId);
        if (reservation == null) return false;

        reservation.IsActive = false;

        if (!string.IsNullOrEmpty(reservation.DeskId))
        {
            var desk = _desks.FirstOrDefault(d => d.Id == reservation.DeskId);
            if (desk != null)
            {
                desk.IsReserved = false;
                desk.ReservedBy = null;
                desk.ReservedUntil = null;
            }
        }

        if (!string.IsNullOrEmpty(reservation.ConferenceRoomId))
        {
            var room = _rooms.FirstOrDefault(r => r.Id == reservation.ConferenceRoomId);
            if (room != null)
            {
                room.IsReserved = false;
                room.ReservedBy = null;
                room.ReservedUntil = null;
            }
        }

        return true;
    }

    public static List<Reservation> GetUserReservations(string userId)
    {
        return _reservations.Where(r => r.UserId == userId && r.IsActive).ToList();
    }

    private static void UpdateReservationStatus()
    {
        var now = DateTime.Now;
        var activeReservations = _reservations.Where(r => r.IsActive && r.ReservedUntil > now).ToList();

        // Reset all desks and rooms
        foreach (var desk in _desks)
        {
            desk.IsReserved = false;
            desk.ReservedBy = null;
            desk.ReservedUntil = null;
        }

        foreach (var room in _rooms)
        {
            room.IsReserved = false;
            room.ReservedBy = null;
            room.ReservedUntil = null;
        }

        // Apply active reservations
        foreach (var reservation in activeReservations)
        {
            if (!string.IsNullOrEmpty(reservation.DeskId))
            {
                var desk = _desks.FirstOrDefault(d => d.Id == reservation.DeskId);
                if (desk != null)
                {
                    desk.IsReserved = true;
                    desk.ReservedBy = reservation.UserId;
                    desk.ReservedUntil = reservation.ReservedUntil;
                }
            }

            if (!string.IsNullOrEmpty(reservation.ConferenceRoomId))
            {
                var room = _rooms.FirstOrDefault(r => r.Id == reservation.ConferenceRoomId);
                if (room != null)
                {
                    room.IsReserved = true;
                    room.ReservedBy = reservation.UserId;
                    room.ReservedUntil = reservation.ReservedUntil;
                }
            }
        }

        // Mark expired reservations as inactive
        foreach (var reservation in _reservations.Where(r => r.IsActive && r.ReservedUntil <= now))
        {
            reservation.IsActive = false;
        }
    }
}

