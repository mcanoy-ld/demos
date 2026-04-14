// http://localhost:5263/swagger/index.html

using LaunchDarkly.Sdk.Server;
using Microsoft.Extensions.Logging;
using MyApp.Namespace;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost3333", policy =>
    {
        policy.WithOrigins("http://localhost:3333", "https://localhost:3333")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton(sp =>
{
    var logger = sp.GetRequiredService<ILogger<LaunchDarklyService>>();
    var sdkKey = builder.Configuration["LaunchDarkly:SdkKey"];
    logger.LogInformation("Creating LaunchDarkly LdClient");
    if (string.IsNullOrEmpty(sdkKey))
    {
        logger.LogCritical(
            "LaunchDarkly SDK key is not set. Set LaunchDarkly:SdkKey in configuration or LAUNCHDARKLY_SDK_KEY.");
        Environment.Exit(1);
    }

    return LaunchDarklyService.CreateLdClient(sdkKey, logger);
});

var app = builder.Build();

// Eagerly create the LaunchDarkly client at host startup (not on first request).
_ = app.Services.GetRequiredService<LdClient>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTP-only launch profile (e.g. "http") has no HTTPS port; UseHttpsRedirection logs a warning.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowLocalhost3333");

app.UseAuthorization();

app.MapControllers();

app.Run();
