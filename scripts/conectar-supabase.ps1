param(
  [Parameter(Mandatory=$true)]
  [ValidatePattern('^[a-z]{20}$')]
  [string]$ProjectRef
)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot

# O CLI oficial utiliza a sessao autenticada. Somente a chave publica vai para o aplicativo.
$keyOutput = & npx.cmd --yes supabase@latest projects api-keys --project-ref $ProjectRef --output json
if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel consultar a chave publica do projeto.' }
$keys = ($keyOutput -join [Environment]::NewLine) | ConvertFrom-Json
$publishable = @($keys | Where-Object { $_.api_key -like 'sb_publishable_*' }) | Select-Object -First 1
if (-not $publishable) { throw 'O projeto ainda nao possui uma chave publishable. Crie-a no painel Supabase e repita.' }
$values = [ordered]@{
  EXPO_PUBLIC_SUPABASE_URL = ('https://' + $ProjectRef + '.supabase.co')
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = $publishable.api_key
}
$envFile = Join-Path $taskRoot '.env'
$lines = if (Test-Path -LiteralPath $envFile) { @(Get-Content -LiteralPath $envFile -Encoding UTF8) } else { @() }
foreach ($key in $values.Keys) {
  $lines = @($lines | Where-Object { -not $_.StartsWith($key + '=') })
  $lines += ($key + '=' + $values[$key])
}
[System.IO.File]::WriteAllLines($envFile, [string[]]$lines, (New-Object System.Text.UTF8Encoding($false)))
Write-Output 'Conexao local configurada com URL e chave publica.'

foreach ($environment in @('preview','production')) {
  foreach ($key in $values.Keys) {
    $null = & npx.cmd --yes --package=eas-cli@latest eas env:set $environment --name $key --value $values[$key] --visibility plaintext --scope project --non-interactive
    if ($LASTEXITCODE -ne 0) { throw ('Falha ao configurar ' + $key + ' no ambiente ' + $environment) }
  }
  Write-Output ('Conexao EAS configurada: ' + $environment)
}
