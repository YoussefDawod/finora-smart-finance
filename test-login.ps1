$uri = "http://localhost:5000/api/auth/login"
$body = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "Testing Login..."
Write-Host "URI: $uri"
Write-Host "Body: $body"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $uri -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    Write-Host "STATUS: $($response.StatusCode)"
    Write-Host "RESPONSE:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "STATUS: $($_.Exception.Response.StatusCode.Value)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $error_content = $reader.ReadToEnd()
        Write-Host "ERROR CONTENT:"
        $error_content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
}
