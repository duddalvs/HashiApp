param([string]$BaseUrl = 'http://localhost:8085')
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
$saved = Get-Content -Raw -Encoding UTF8 -LiteralPath '.tools/hashimoto-users-access.json' | ConvertFrom-Json
$accounts = @()
foreach ($user in $saved.users) {
  $credential = New-Object System.Management.Automation.PSCredential($user.login,(ConvertTo-SecureString -String $user.senha_dpapi))
  $accounts += @{login=$user.login;password=$credential.GetNetworkCredential().Password}
}
try {
  $env:HASHI_TEST_ACCOUNTS = ConvertTo-Json -InputObject $accounts -Compress
  $env:HASHI_TEST_URL = $BaseUrl
  & node --env-file=.env scripts/verificar-edicao-remota.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Verificacao remota falhou.' }
} finally {
  Remove-Item Env:HASHI_TEST_ACCOUNTS -ErrorAction SilentlyContinue
  Remove-Item Env:HASHI_TEST_URL -ErrorAction SilentlyContinue
  $credential=$null; $accounts=$null
}
