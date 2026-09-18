param([string]$Login = '')
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$access = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $taskRoot '.tools/hashimoto-users-access.json') | ConvertFrom-Json
Write-Host 'HASHI APP - Acessos ao aplicativo'
foreach ($user in @($access.users)) {
  if ($Login -and $user.login -ne $Login) { continue }
  $credential = New-Object System.Management.Automation.PSCredential($user.login,(ConvertTo-SecureString -String $user.senha_dpapi))
  try {
    Write-Host ''
    Write-Host ('Usuario: ' + $user.login)
    Write-Host ('Perfil: ' + $user.perfil)
    Write-Host ('Senha: ' + $credential.GetNetworkCredential().Password)
  } finally { $credential=$null }
}
Write-Host ''
$null = Read-Host 'Guarde seus acessos. Pressione Enter para fechar'
Clear-Host
