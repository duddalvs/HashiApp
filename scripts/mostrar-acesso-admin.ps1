$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$accessFile = Join-Path $taskRoot '.tools/hashimoto-admin-access.json'
if (-not (Test-Path -LiteralPath $accessFile)) { throw 'Acesso ainda nao criado neste computador.' }
$access = Get-Content -Raw -Encoding UTF8 -LiteralPath $accessFile | ConvertFrom-Json
$securePassword = ConvertTo-SecureString -String $access.senha_dpapi
$credential = New-Object System.Management.Automation.PSCredential($access.email,$securePassword)
try {
  Write-Host ''
  Write-Host 'HASHIMOTO FROTA - Acesso ao aplicativo'
  Write-Host ('Email: ' + $access.email)
  Write-Host ('Senha: ' + $credential.GetNetworkCredential().Password)
  Write-Host ''
  Write-Host 'Use estes dados na tela Entrar do aplicativo. Guarde a senha em local seguro.'
  $null = Read-Host 'Pressione Enter para fechar'
  Clear-Host
} finally { $credential = $null; $securePassword = $null }
