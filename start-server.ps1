# Indian Police E-FIR Citizen Portal - Local Server & Launcher
# Run this script in PowerShell to launch the web application

$port = 8080
$folder = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Indian Police E-FIR Citizen Portal (Prototype)" -ForegroundColor Yellow
Write-Host " Bilingual E-FIR + DigiLocker Verification + E-Signature" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting local HTTP server on http://localhost:$port/" -ForegroundColor White

$url = "http://localhost:$port/"
Start-Process $url

try {
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
    Write-Host "Server running! Press Ctrl+C in this terminal to stop." -ForegroundColor Green

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($path)) {
            $path = "index.html"
        }

        $filePath = Join-Path $folder $path

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                default { "application/octet-stream" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.OutputStream.Close()
    }
} finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
    }
}
