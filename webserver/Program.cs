var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:5000");

var app = builder.Build();

var rootDir = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, ".."));

app.Run(async context =>
{
    var path = context.Request.Path.Value?.TrimStart('/') ?? "";
    if (string.IsNullOrEmpty(path))
    {
        path = "index.html";
    }

    var filePath = Path.Combine(rootDir, path);
    if (File.Exists(filePath))
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        var contentType = ext switch
        {
            ".html" => "text/html; charset=utf-8",
            ".css" => "text/css; charset=utf-8",
            ".js" => "application/javascript; charset=utf-8",
            ".json" => "application/json; charset=utf-8",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".svg" => "image/svg+xml",
            _ => "application/octet-stream"
        };

        context.Response.ContentType = contentType;
        context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
        await context.Response.SendFileAsync(filePath);
    }
    else
    {
        context.Response.StatusCode = 404;
        await context.Response.WriteAsync("404 Not Found");
    }
});

app.Run();
