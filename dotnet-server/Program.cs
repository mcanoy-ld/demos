
// http://localhost:5263/swagger/index.html

using MyApp.Namespace;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton( _=> {
    var sdkKey = builder.Configuration["LaunchDarkly:SdkKey"];
    Console.WriteLine("** creating LdClient **");
    if (string.IsNullOrEmpty(sdkKey))
    {
        Console.WriteLine("*** Please set LAUNCHDARKLY_SDK_KEY environment variable to your LaunchDarkly SDK key first\n");
        Environment.Exit(1);
    }
    return LaunchDarklyService.CreateLdClient(sdkKey);
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
