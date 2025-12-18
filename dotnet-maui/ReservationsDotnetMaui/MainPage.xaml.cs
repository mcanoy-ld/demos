using LaunchDarkly.Hello;
using LaunchDarkly.Sdk.Client.Interfaces;
using ReservationsDotnetMaui.Services;

namespace ReservationsDotnetMaui;

public partial class MainPage : ContentPage
{
	public MainPage()
	{
		InitializeComponent();
	}

	protected override async void OnAppearing()
	{
		base.OnAppearing();
		
		// Update user badge
		UpdateUserBadge();
		
		// Update context display
		UpdateContextDisplay();
		
		// Set initial flag key
		FlagKeyLabel.Text = DemoParameters.FeatureFlagKey;
		
		if (MauiProgram.client.Initialized)
		{
			UpdateFlagValue();
			UpdateHotelingFlagValue();
			MauiProgram.client.FlagTracker.FlagValueChanged += FeatureFlagChanged;
		}
		else
		{
			StatusLabel.Text = "Not Initialized";
			StatusLabel.TextColor = Colors.Red;
			StatusIndicator.BackgroundColor = Colors.Red;
			FlagValueLabel.Text = "—";
			
			HotelingStatusLabel.Text = "Not Initialized";
			HotelingStatusLabel.TextColor = Colors.Red;
			HotelingStatusIndicator.BackgroundColor = Colors.Red;
			HotelingFlagValueLabel.Text = "—";
		}
	}

	void UpdateUserBadge()
	{
		if (!string.IsNullOrEmpty(UserService.CurrentUser))
		{
			UserInitialLabel.Text = UserService.GetInitial();
			UserBadge.IsVisible = true;
			LaunchDarklyLabel.IsVisible = true;
		}
		else
		{
			UserBadge.IsVisible = false;
			LaunchDarklyLabel.IsVisible = false;
		}
	}

	void UpdateContextDisplay()
	{
		ContextLabel.Text = ContextService.GetContextDisplay();
	}

	void UpdateFlagValue()
	{
		var flagValue = MauiProgram.client.BoolVariation(DemoParameters.FeatureFlagKey, false);
		
		// Update flag key label
		FlagKeyLabel.Text = DemoParameters.FeatureFlagKey;
		
		// Update flag value display
		FlagValueLabel.Text = flagValue ? "TRUE" : "FALSE";
		
		// Update status indicator and colors
		var trueColor = Application.Current?.Resources["BackgroundTrue"] as Color ?? Colors.Green;
		var falseColor = Application.Current?.Resources["BackgroundFalse"] as Color ?? Colors.Gray;
		
		if (flagValue)
		{
			StatusIndicator.BackgroundColor = trueColor;
			StatusLabel.Text = "Enabled";
			StatusLabel.TextColor = trueColor;
			ValueFrame.BackgroundColor = Color.FromRgba(trueColor.Red, trueColor.Green, trueColor.Blue, 0.1);
			ValueFrame.Stroke = trueColor;
			FlagValueLabel.TextColor = trueColor;
			MainPageLayout.BackgroundColor = Color.FromRgba(trueColor.Red, trueColor.Green, trueColor.Blue, 0.05);
		}
		else
		{
			StatusIndicator.BackgroundColor = falseColor;
			StatusLabel.Text = "Disabled";
			StatusLabel.TextColor = falseColor;
			ValueFrame.BackgroundColor = Color.FromRgba(falseColor.Red, falseColor.Green, falseColor.Blue, 0.1);
			ValueFrame.Stroke = falseColor;
			FlagValueLabel.TextColor = falseColor;
			MainPageLayout.BackgroundColor = Color.FromRgba(falseColor.Red, falseColor.Green, falseColor.Blue, 0.05);
		}
	}

	void FeatureFlagChanged(object? sender, FlagValueChangeEvent args)
	{
		if (args.Key == DemoParameters.FeatureFlagKey)
		{
			UpdateFlagValue();
		}
		else if (args.Key == "enabled-office-conf-room-hoteling")
		{
			UpdateHotelingFlagValue();
		}
	}

	void UpdateHotelingFlagValue()
	{
		const string hotelingFlagKey = "enabled-office-conf-room-hoteling";
		var flagValue = MauiProgram.client.BoolVariation(hotelingFlagKey, false);
		
		// Update flag key label
		HotelingFlagKeyLabel.Text = hotelingFlagKey;
		
		// Update flag value display
		HotelingFlagValueLabel.Text = flagValue ? "TRUE" : "FALSE";
		
		// Update status indicator and colors
		var trueColor = Application.Current?.Resources["BackgroundTrue"] as Color ?? Colors.Green;
		var falseColor = Application.Current?.Resources["BackgroundFalse"] as Color ?? Colors.Gray;
		
		if (flagValue)
		{
			HotelingStatusIndicator.BackgroundColor = trueColor;
			HotelingStatusLabel.Text = "Enabled";
			HotelingStatusLabel.TextColor = trueColor;
			HotelingValueFrame.BackgroundColor = Color.FromRgba(trueColor.Red, trueColor.Green, trueColor.Blue, 0.1);
			HotelingValueFrame.Stroke = trueColor;
			HotelingFlagValueLabel.TextColor = trueColor;
		}
		else
		{
			HotelingStatusIndicator.BackgroundColor = falseColor;
			HotelingStatusLabel.Text = "Disabled";
			HotelingStatusLabel.TextColor = falseColor;
			HotelingValueFrame.BackgroundColor = Color.FromRgba(falseColor.Red, falseColor.Green, falseColor.Blue, 0.1);
			HotelingValueFrame.Stroke = falseColor;
			HotelingFlagValueLabel.TextColor = falseColor;
		}
	}

	private async void OnReserveDeskClicked(object? sender, EventArgs e)
	{
		await Shell.Current.GoToAsync("//ReservationPage");
	}
}

