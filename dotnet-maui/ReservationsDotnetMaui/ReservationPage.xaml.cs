using ReservationsDotnetMaui.Models;
using ReservationsDotnetMaui.Services;
using LaunchDarkly.Sdk;
using LaunchDarkly.Sdk.Client;
using LaunchDarkly.Sdk.Client.Interfaces;

namespace ReservationsDotnetMaui;

public partial class ReservationPage : ContentPage
{
    private List<Office> _offices;
    private List<Desk> _desks = new();
    private List<ConferenceRoom> _rooms = new();
    private List<ReservationViewModel> _myReservations = new();
    private string _currentOfficeId = "la";
    private bool _showDesks = true;
    private const string HotelingFlagKey = "enabled-office-conf-room-hoteling";

    public ReservationPage()
    {
        InitializeComponent();
        _offices = Office.GetOffices();
        LoadOffices();
        LoadData();
        UpdateTabButtons();
        UpdateConferenceRoomVisibility();
        
        // Listen for flag changes
        if (MauiProgram.client != null && MauiProgram.client.Initialized)
        {
            MauiProgram.client.FlagTracker.FlagValueChanged += OnFlagChanged;
        }
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        LoadData();
        UpdateConferenceRoomVisibility();
        
        // Update LaunchDarkly context with current office selection
        if (OfficePicker.SelectedIndex >= 0 && OfficePicker.SelectedIndex < _offices.Count)
        {
            var selectedOffice = _offices[OfficePicker.SelectedIndex];
            UpdateLaunchDarklyContext(selectedOffice);
        }
        else if (_offices.Count > 0)
        {
            // Set default office if none selected
            var defaultOffice = _offices.FirstOrDefault(o => o.Id == "la");
            if (defaultOffice != null)
            {
                UpdateLaunchDarklyContext(defaultOffice);
            }
        }
    }

    private void LoadOffices()
    {
        OfficePicker.ItemsSource = _offices.Select(o => o.Name).ToList();
        var defaultOffice = _offices.FirstOrDefault(o => o.Id == "la");
        if (defaultOffice != null)
        {
            OfficePicker.SelectedIndex = _offices.IndexOf(defaultOffice);
        }
    }

    private void OnOfficeSelected(object? sender, EventArgs e)
    {
        if (OfficePicker.SelectedIndex >= 0 && OfficePicker.SelectedIndex < _offices.Count)
        {
            var selectedOffice = _offices[OfficePicker.SelectedIndex];
            _currentOfficeId = selectedOffice.Id;
            UpdateLaunchDarklyContext(selectedOffice);
            LoadData();
        }
    }

    private void UpdateLaunchDarklyContext(Office office)
    {
        if (MauiProgram.client == null || !MauiProgram.client.Initialized)
        {
            return;
        }

        try
        {
            var currentUser = UserService.CurrentUser;
            if (string.IsNullOrEmpty(currentUser))
            {
                return;
            }

            // Create user context (keeping existing user context)
            var userContext = Context.Builder($"{currentUser}-key")
                .Kind("user")
                .Name(currentUser)
                .Build();

            // Create office context
            // Key format: "location-key" with dashes for spaces (e.g., "los-angeles-key")
            var officeKey = office.Name.ToLower().Replace(" ", "-") + "-key";
            var officeContext = Context.Builder(officeKey)
                .Kind("office")
                .Set("location", office.Name)
                .Build();

            // Create multi-context combining user and office
            var multiContext = Context.MultiBuilder()
                .Add(userContext)
                .Add(officeContext)
                .Build();

            // Call Identify to update the context
            MauiProgram.client.Identify(multiContext, TimeSpan.FromSeconds(5));
            
            // Update context service for display
            ContextService.CurrentUser = currentUser;
            ContextService.CurrentOffice = office.Name;

            UpdateConferenceRoomVisibility();
        }
        catch (Exception ex)
        {
            // Log error but don't interrupt user flow
            System.Diagnostics.Debug.WriteLine($"Failed to update LaunchDarkly context: {ex.Message}");
        }
    }

    private void LoadData()
    {
        _desks = ReservationService.GetDesks(_currentOfficeId);
        _rooms = ReservationService.GetConferenceRooms(_currentOfficeId);
        
        DesksCollectionView.ItemsSource = _desks;
        RoomsCollectionView.ItemsSource = _rooms;

        LoadMyReservations();
    }

    private void LoadMyReservations()
    {
        var userId = UserService.CurrentUser ?? "Unknown";
        var reservations = ReservationService.GetUserReservations(userId);
        
        // Check if hoteling is enabled
        bool isHotelingEnabled = false;
        if (MauiProgram.client != null && MauiProgram.client.Initialized)
        {
            isHotelingEnabled = MauiProgram.client.BoolVariation(HotelingFlagKey, false);
        }
        
        // Filter reservations - if hoteling is disabled, only show desk reservations
        var filteredReservations = isHotelingEnabled 
            ? reservations 
            : reservations.Where(r => !string.IsNullOrEmpty(r.DeskId)).ToList();
        
        _myReservations = filteredReservations.Select(r => new ReservationViewModel
        {
            Id = r.Id,
            ResourceName = !string.IsNullOrEmpty(r.DeskId) 
                ? _desks.FirstOrDefault(d => d.Id == r.DeskId)?.Name ?? "Desk"
                : _rooms.FirstOrDefault(room => room.Id == r.ConferenceRoomId)?.Name ?? "Room",
            OfficeName = _offices.FirstOrDefault(o => o.Id == r.OfficeId)?.Name ?? "Unknown",
            ReservedUntil = r.ReservedUntil
        }).ToList();

        MyReservationsCollectionView.ItemsSource = _myReservations;
        NoReservationsLabel.IsVisible = _myReservations.Count == 0;
    }

    private void OnDesksTabClicked(object? sender, EventArgs e)
    {
        _showDesks = true;
        DesksSection.IsVisible = true;
        RoomsSection.IsVisible = false;
        UpdateTabButtons();
    }

    private void OnRoomsTabClicked(object? sender, EventArgs e)
    {
        _showDesks = false;
        DesksSection.IsVisible = false;
        RoomsSection.IsVisible = true;
        UpdateTabButtons();
    }

    private void UpdateTabButtons()
    {
        if (_showDesks)
        {
            DesksTabButton.BackgroundColor = Application.Current?.Resources["Primary"] as Color ?? Colors.Blue;
            DesksTabButton.TextColor = Colors.White;
            RoomsTabButton.BackgroundColor = Colors.LightGray;
            RoomsTabButton.TextColor = Colors.Black;
        }
        else
        {
            RoomsTabButton.BackgroundColor = Application.Current?.Resources["Primary"] as Color ?? Colors.Blue;
            RoomsTabButton.TextColor = Colors.White;
            DesksTabButton.BackgroundColor = Colors.LightGray;
            DesksTabButton.TextColor = Colors.Black;
        }
    }

    private void UpdateConferenceRoomVisibility()
    {
        bool isHotelingEnabled = false;
        
        if (MauiProgram.client != null && MauiProgram.client.Initialized)
        {
            isHotelingEnabled = MauiProgram.client.BoolVariation(HotelingFlagKey, false);
        }
        
        // Show/hide conference room tab button
        RoomsTabButton.IsVisible = isHotelingEnabled;
        
        // If hoteling is disabled and we're showing rooms, switch to desks
        if (!isHotelingEnabled && !_showDesks)
        {
            _showDesks = true;
            DesksSection.IsVisible = true;
            RoomsSection.IsVisible = false;
            UpdateTabButtons();
        }
        
        // Update header text
        UpdateHeaderText(isHotelingEnabled);
        
        // Refresh reservations to filter out conference rooms if disabled
        LoadMyReservations();
    }

    private void UpdateHeaderText(bool isHotelingEnabled)
    {
        HeaderSubtitleLabel.Text = isHotelingEnabled 
            ? "Reserve desks and conference rooms"
            : "Reserve desks";
    }

    private void OnFlagChanged(object? sender, FlagValueChangeEvent args)
    {
        if (args.Key == HotelingFlagKey)
        {
            UpdateConferenceRoomVisibility();
        }
    }

    private async void OnReserveDeskClicked(object? sender, EventArgs e)
    {
        if (sender is Button button && button.CommandParameter is string deskId)
        {
            var userId = UserService.CurrentUser ?? "Unknown";
            var reservedUntil = DateTime.Now.AddDays(1); // Reserve for 1 day by default

            var result = await DisplayActionSheetAsync(
                "Reserve Desk",
                "Cancel",
                null,
                "Reserve for 1 day",
                "Reserve for 3 days",
                "Reserve for 1 week"
            );

            if (result != null && result != "Cancel")
            {
                if (result.Contains("1 day"))
                    reservedUntil = DateTime.Now.AddDays(1);
                else if (result.Contains("3 days"))
                    reservedUntil = DateTime.Now.AddDays(3);
                else if (result.Contains("1 week"))
                    reservedUntil = DateTime.Now.AddDays(7);

                if (ReservationService.ReserveDesk(deskId, userId, reservedUntil))
                {
                    await DisplayAlertAsync("Success", "Desk reserved successfully!", "OK");
                    LoadData();
                }
                else
                {
                    await DisplayAlertAsync("Error", "Failed to reserve desk. It may already be reserved.", "OK");
                }
            }
        }
    }

    private async void OnReserveRoomClicked(object? sender, EventArgs e)
    {
        if (sender is Button button && button.CommandParameter is string roomId)
        {
            var userId = UserService.CurrentUser ?? "Unknown";
            var reservedUntil = DateTime.Now.AddHours(2); // Reserve for 2 hours by default

            var result = await DisplayActionSheetAsync(
                "Reserve Conference Room",
                "Cancel",
                null,
                "Reserve for 1 hour",
                "Reserve for 2 hours",
                "Reserve for 4 hours"
            );

            if (result != null && result != "Cancel")
            {
                if (result.Contains("1 hour"))
                    reservedUntil = DateTime.Now.AddHours(1);
                else if (result.Contains("2 hours"))
                    reservedUntil = DateTime.Now.AddHours(2);
                else if (result.Contains("4 hours"))
                    reservedUntil = DateTime.Now.AddHours(4);

                if (ReservationService.ReserveConferenceRoom(roomId, userId, reservedUntil))
                {
                    await DisplayAlertAsync("Success", "Conference room reserved successfully!", "OK");
                    LoadData();
                }
                else
                {
                    await DisplayAlertAsync("Error", "Failed to reserve room. It may already be reserved.", "OK");
                }
            }
        }
    }

    private async void OnDeskSelected(object? sender, SelectionChangedEventArgs e)
    {
        // Handle desk selection if needed
    }

    private async void OnRoomSelected(object? sender, SelectionChangedEventArgs e)
    {
        // Handle room selection if needed
    }

    private async void OnCancelReservationClicked(object? sender, EventArgs e)
    {
        if (sender is Button button && button.CommandParameter is string reservationId)
        {
            var confirm = await DisplayAlertAsync(
                "Cancel Reservation",
                "Are you sure you want to cancel this reservation?",
                "Yes",
                "No"
            );

            if (confirm)
            {
                if (ReservationService.CancelReservation(reservationId))
                {
                    await DisplayAlertAsync("Success", "Reservation cancelled successfully!", "OK");
                    LoadData();
                }
                else
                {
                    await DisplayAlertAsync("Error", "Failed to cancel reservation.", "OK");
                }
            }
        }
    }
}

public class ReservationViewModel
{
    public string Id { get; set; } = string.Empty;
    public string ResourceName { get; set; } = string.Empty;
    public string OfficeName { get; set; } = string.Empty;
    public DateTime ReservedUntil { get; set; }
}

