param(
  [Parameter(Mandatory=$true)][string]$Email
)
$ErrorActionPreference = 'Stop'
throw 'Ferramenta antiga desativada. Para criar administrador, use public.cadastrar_usuario no SQL Editor; consulte docs/ACESSOS.md.'
if ($Email -notmatch '^[a-z][a-z0-9_]{2,39}@hashimoto[.]invalid$') {
  throw 'Cadastro por email pessoal descontinuado. Consulte o cadastro por nome de usuario no README.md.'
}
$taskRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
$projectRef = 'qxkhjlkexsjgkttdugqt'
$baseUrl = 'https://' + $projectRef + '.supabase.co'
$accessFile = Join-Path $taskRoot '.tools/hashimoto-admin-access.json'
$null = [System.Net.Mail.MailAddress]::new($Email)

# Consulta pelo CLI oficial autenticado; chaves ficam apenas na memoria deste processo.
$keyOutput = & npx.cmd --yes supabase@latest projects api-keys --project-ref $projectRef --reveal --output json
if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel consultar as credenciais administrativas pelo CLI.' }
$keys = ($keyOutput -join [Environment]::NewLine) | ConvertFrom-Json
$serverKey = @($keys | Where-Object { $_.name -eq 'service_role' }) | Select-Object -First 1
if (-not $serverKey) { $serverKey = @($keys | Where-Object { $_.api_key -like 'sb_secret_*' }) | Select-Object -First 1 }
$publicKey = @($keys | Where-Object { $_.api_key -like 'sb_publishable_*' }) | Select-Object -First 1
if (-not $serverKey -or -not $publicKey) { throw 'Chaves necessarias nao encontradas.' }
$adminHeaders = @{ apikey=$serverKey.api_key; Authorization=('Bearer ' + $serverKey.api_key) }
try {
  $existingUsers = Invoke-RestMethod -Method Get -Uri ($baseUrl + '/auth/v1/admin/users?page=1&per_page=1000') -Headers $adminHeaders
  $existing = @($existingUsers.users | Where-Object { $_.email -eq $Email }) | Select-Object -First 1
  $saved = if (Test-Path -LiteralPath $accessFile) { Get-Content -Raw -Encoding UTF8 -LiteralPath $accessFile | ConvertFrom-Json } else { $null }
  if ($saved -and ($saved.email -ne $Email -or $saved.project_ref -ne $projectRef)) { throw 'Existe um acesso local de outro usuario ou projeto; nenhuma senha foi alterada.' }
  if ($existing -and -not $saved) { throw 'O usuario ja existe e sua senha foi preservada. Ative seu perfil pelo painel.' }
  if ($saved) {
    $securePassword = ConvertTo-SecureString -String $saved.senha_dpapi
    $passwordCredential = New-Object System.Management.Automation.PSCredential($Email,$securePassword)
    $appPassword = $passwordCredential.GetNetworkCredential().Password
  } else {
    $randomBytes = New-Object byte[] 24
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $generator.GetBytes($randomBytes)
    $generator.Dispose()
    $appPassword = [Convert]::ToBase64String($randomBytes).TrimEnd('=').Replace('+','-').Replace('/','_') + 'aA9!'
    $encryptedPassword = ConvertTo-SecureString -String $appPassword -AsPlainText -Force | ConvertFrom-SecureString
    $saved = [ordered]@{project_ref=$projectRef; email=$Email; senha_dpapi=$encryptedPassword}
    [System.IO.File]::WriteAllText($accessFile,($saved | ConvertTo-Json), (New-Object System.Text.UTF8Encoding($false)))
  }
  if (-not $existing) {
    $body = @{email=$Email; password=$appPassword; email_confirm=$true; user_metadata=@{nome='Administrador Hashimoto'}} | ConvertTo-Json -Depth 4
    $existing = Invoke-RestMethod -Method Post -Uri ($baseUrl + '/auth/v1/admin/users') -Headers $adminHeaders -ContentType 'application/json' -Body $body
  }
  $userId = ([Guid]$existing.id).ToString()
  $activationFile = Join-Path $taskRoot '.tools/ativar-admin.sql'
  $activation = "update public.usuarios set ativo=true, perfil='admin' where id='$userId'; select perfil,ativo from public.usuarios where id='$userId';"
  [System.IO.File]::WriteAllText($activationFile,$activation,(New-Object System.Text.UTF8Encoding($false)))
  & npx.cmd --yes supabase@latest db query --linked --project-ref $projectRef --file $activationFile --output json
  if ($LASTEXITCODE -ne 0) { throw 'Conta criada, mas ativacao do perfil pendente.' }

  # Testa o mesmo login por senha e as consultas utilizadas no aplicativo.
  $publicHeaders = @{apikey=$publicKey.api_key}
  $loginBody = @{email=$Email;password=$appPassword} | ConvertTo-Json
  $session = Invoke-RestMethod -Method Post -Uri ($baseUrl + '/auth/v1/token?grant_type=password') -Headers $publicHeaders -ContentType 'application/json' -Body $loginBody
  $userHeaders = @{apikey=$publicKey.api_key;Authorization=('Bearer ' + $session.access_token)}
  $profile = Invoke-RestMethod -Method Get -Uri ($baseUrl + '/rest/v1/usuarios?select=perfil,ativo&id=eq.' + $userId) -Headers $userHeaders
  if (@($profile).Count -ne 1 -or -not $profile[0].ativo -or $profile[0].perfil -ne 'admin') { throw 'Falha ao validar o perfil do administrador.' }
  $expected = [ordered]@{veiculos=82;funcionarios=102;contratos=9;tipos_manutencao=8}
  foreach ($table in $expected.Keys) {
    $rows = Invoke-RestMethod -Method Get -Uri ($baseUrl + '/rest/v1/' + $table + '?select=id&ativo=eq.true') -Headers $userHeaders
    if (@($rows).Count -ne $expected[$table]) { throw ('Quantidade inesperada em ' + $table) }
    Write-Output ('Catalogo validado: ' + $table + ' (' + @($rows).Count + ')')
  }
  $null = Invoke-RestMethod -Method Post -Uri ($baseUrl + '/auth/v1/logout?scope=local') -Headers $userHeaders
  Write-Output 'Administrador criado, ativo e login validado. A senha esta protegida pelo Windows no arquivo local de acesso.'
} finally {
  $appPassword = $null; $body = $null; $loginBody = $null; $passwordCredential = $null
  $keyOutput = $null; $keys = $null; $serverKey = $null; $adminHeaders = $null; $session = $null; $userHeaders = $null
}
