$envPath = '.env'
$secretKey = 'a7K9mP2xR4yT6bN8cV0dF2gH4jL6kM8nP0'
$lines = Get-Content $envPath
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '^SECRET_KEY=') {
        $lines[$i] = 'SECRET_KEY=' + $secretKey
        break
    }
}
$lines | Set-Content $envPath
Write-Host 'SECRET_KEY updated successfully!'
Write-Host ('New key length: ' + $secretKey.Length + ' characters')
