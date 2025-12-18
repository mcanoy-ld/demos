using LaunchDarkly.Sdk;
using LaunchDarkly.Sdk.Client;
using ReservationsDotnetMaui.Services;

namespace ReservationsDotnetMaui;

public partial class LoginPage : ContentPage
{
    private readonly List<string> _users = new() { "Roisin", "Ian", "George", "Evelyn" };
    private string? _selectedUser;

    public LoginPage()
    {
        InitializeComponent();
        
        // Populate picker
        UserPicker.ItemsSource = _users;
        UserPicker.SelectedIndexChanged += OnUserSelected;
    }

    private void OnUserSelected(object? sender, EventArgs e)
    {
        if (UserPicker.SelectedIndex >= 0 && UserPicker.SelectedIndex < _users.Count)
        {
            _selectedUser = _users[UserPicker.SelectedIndex];
            LoginButton.IsEnabled = true;
        }
        else
        {
            _selectedUser = null;
            LoginButton.IsEnabled = false;
        }
    }

    private async void OnLoginClicked(object? sender, EventArgs e)
    {
        if (string.IsNullOrEmpty(_selectedUser))
        {
            await DisplayAlertAsync("Selection Required", "Please select a user from the dropdown.", "OK");
            return;
        }

        try
        {
            // Create LaunchDarkly context with user kind
            var context = Context.Builder($"{_selectedUser}-key")
                .Kind("user")
                .Name(_selectedUser)
                .Build();

            // Call Identify to update the context
            if (MauiProgram.client != null && MauiProgram.client.Initialized)
            {
                MauiProgram.client.Identify(context, TimeSpan.FromSeconds(5));
                
                // Store current user for display
                UserService.CurrentUser = _selectedUser;
                ContextService.CurrentUser = _selectedUser;
                
                // Navigate to main page
                await Shell.Current.GoToAsync("//MainPage");
            }
            else
            {
                await DisplayAlertAsync("Error", "LaunchDarkly client is not initialized.", "OK");
            }
        }
        catch (Exception ex)
        {
            await DisplayAlertAsync("Error", $"Failed to login: {ex.Message}", "OK");
        }
    }
}
