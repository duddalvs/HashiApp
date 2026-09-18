$ErrorActionPreference = 'Stop'
throw 'Ferramenta antiga desativada. O acesso agora usa apenas usuarios. Cadastre pelo SQL Editor com public.cadastrar_usuario; consulte docs/ACESSOS.md.'
$taskRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
$projectRef = 'qxkhjlkexsjgkttdugqt'
$baseUrl = 'https://' + $projectRef + '.supabase.co'
$accessFile = Join-Path $taskRoot '.tools/hashimoto-users-access.json'
$oldEmail = 'dev.hashimoto.ltda@gmail.com'
$expectedOldId = 'a7ee5449-bf2b-46a8-9cf1-027d52faf903'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Save-Access($Value) { [IO.File]::WriteAllText($accessFile, ($Value | ConvertTo-Json -Depth 6), $utf8) }
function New-AppPassword {
  $bytes = New-Object byte[] 15
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return ([Convert]::ToBase64String($bytes).Replace('+','-').Replace('/','_') + 'aA9!')
}

# Chaves consultadas pelo CLI oficial, mantidas somente na memoria do processo.
$keyOutput = & npx.cmd --yes supabase@2.117.0 projects api-keys --project-ref $projectRef --reveal --output json
if ($LASTEXITCODE -ne 0) { throw 'Falha ao consultar as chaves do projeto.' }
$keys = ($keyOutput -join [Environment]::NewLine) | ConvertFrom-Json
$serverKey = @($keys | Where-Object { $_.name -eq 'service_role' }) | Select-Object -First 1
if (-not $serverKey) { $serverKey = @($keys | Where-Object { $_.api_key -like 'sb_secret_*' }) | Select-Object -First 1 }
$publicKey = @($keys | Where-Object { $_.api_key -like 'sb_publishable_*' }) | Select-Object -First 1
if (-not $serverKey -or -not $publicKey) { throw 'Chaves necessarias nao encontradas.' }
$adminHeaders = @{apikey=$serverKey.api_key;Authorization=('Bearer ' + $serverKey.api_key)}
try {
  $access = if (Test-Path -LiteralPath $accessFile) { Get-Content -Raw -Encoding UTF8 -LiteralPath $accessFile | ConvertFrom-Json } else {
    [pscustomobject]@{project_ref=$projectRef;users=@()}
  }
  if ($access.project_ref -ne $projectRef) { throw 'Arquivo de acesso pertence a outro projeto.' }
  $users = (Invoke-RestMethod -Uri ($baseUrl + '/auth/v1/admin/users?page=1&per_page=1000') -Headers $adminHeaders).users
  $old = @($users | Where-Object { $_.email -eq $oldEmail }) | Select-Object -First 1
  if ($old -and $old.id -ne $expectedOldId) { throw 'A conta antiga nao corresponde ao ID conferido. Nenhuma conta foi apagada.' }

  foreach ($definition in @(@{login='user_admin';perfil='admin'},@{login='user_pessoa1';perfil='funcionario'})) {
    $login = $definition.login
    $email = $login + '@hashimoto.invalid'
    $existing = @($users | Where-Object { $_.email -eq $email }) | Select-Object -First 1
    $saved = @($access.users | Where-Object { $_.login -eq $login }) | Select-Object -First 1
    if ($existing -and -not $saved) { throw ('A conta ' + $login + ' ja existe sem senha local. Nenhuma senha foi alterada.') }
    if (-not $saved) {
      $password = New-AppPassword
      $encrypted = ConvertTo-SecureString -String $password -AsPlainText -Force | ConvertFrom-SecureString
      $saved = [pscustomobject]@{login=$login;perfil=$definition.perfil;email=$email;senha_dpapi=$encrypted;id=$null}
      $access.users = @($access.users) + @($saved)
      Save-Access $access
    } else {
      $credential = New-Object System.Management.Automation.PSCredential($login,(ConvertTo-SecureString -String $saved.senha_dpapi))
      $password = $credential.GetNetworkCredential().Password
    }
    if (-not $existing) {
      $body = @{email=$email;password=$password;email_confirm=$true;user_metadata=@{nome=$login}} | ConvertTo-Json -Depth 4
      $existing = Invoke-RestMethod -Method Post -Uri ($baseUrl + '/auth/v1/admin/users') -Headers $adminHeaders -ContentType 'application/json' -Body $body
    }
    $saved.id = ([guid]$existing.id).ToString()
    Save-Access $access
    $activationFile = Join-Path $taskRoot '.tools/ativar-usuarios.sql'
    $activation = "update public.usuarios set login='$login',nome='$login',perfil='$($definition.perfil)',ativo=true where id='$($saved.id)'; select login,perfil,ativo from public.usuarios where id='$($saved.id)';"
    [IO.File]::WriteAllText($activationFile,$activation,$utf8)
    & npx.cmd --yes supabase@2.117.0 db query --linked --project-ref $projectRef --file $activationFile --output json
    if ($LASTEXITCODE -ne 0) { throw ('Ativacao pendente: ' + $login) }
    $session = Invoke-RestMethod -Method Post -Uri ($baseUrl + '/auth/v1/token?grant_type=password') -Headers @{apikey=$publicKey.api_key} -ContentType 'application/json' -Body (@{email=$email;password=$password} | ConvertTo-Json)
    $userHeaders = @{apikey=$publicKey.api_key;Authorization=('Bearer ' + $session.access_token)}
    $profile = @(Invoke-RestMethod -Uri ($baseUrl + '/rest/v1/usuarios?select=login,perfil,ativo&id=eq.' + $saved.id) -Headers $userHeaders)
    if ($profile.Count -ne 1 -or $profile[0].login -ne $login -or $profile[0].perfil -ne $definition.perfil -or -not $profile[0].ativo) { throw 'Perfil inesperado apos login.' }
    $null = Invoke-RestMethod -Method Post -Uri ($baseUrl + '/auth/v1/logout?scope=local') -Headers $userHeaders
    Write-Output ('Login validado: ' + $login + ' (' + $definition.perfil + ')')
  }

  # Substitui somente a conta identificada pelo usuario e preserva seus envios.
  if ($old) {
    $newAdmin = @($access.users | Where-Object { $_.login -eq 'user_admin' })[0]
    $transferFile = Join-Path $taskRoot '.tools/transferir-envios.sql'
    $transfer = @"
begin;
lock table public.registros_frota,public.manutencoes in share row exclusive mode;
update public.usuarios set ativo=false where id='$expectedOldId';
update public.registros_frota set usuario_id='$($newAdmin.id)',versao=versao+1 where usuario_id='$expectedOldId';
update public.manutencoes set usuario_id='$($newAdmin.id)',versao=versao+1 where usuario_id='$expectedOldId';
select (select count(*) from public.registros_frota where usuario_id='$($newAdmin.id)') as registros_preservados,
       (select count(*) from public.manutencoes where usuario_id='$($newAdmin.id)') as manutencoes_preservadas;
commit;
"@
    [IO.File]::WriteAllText($transferFile,$transfer,$utf8)
    & npx.cmd --yes supabase@2.117.0 db query --linked --project-ref $projectRef --file $transferFile --output json
    if ($LASTEXITCODE -ne 0) { throw 'Transferencia nao concluida; conta antiga nao foi apagada.' }
    $null = Invoke-RestMethod -Method Delete -Uri ($baseUrl + '/auth/v1/admin/users/' + $expectedOldId) -Headers $adminHeaders
    Write-Output 'Conta antiga removida do Auth apos preservar os envios no novo administrador.'
  }
  $finalUsers = (Invoke-RestMethod -Uri ($baseUrl + '/auth/v1/admin/users?page=1&per_page=1000') -Headers $adminHeaders).users
  if (@($finalUsers | Where-Object { $_.id -eq $expectedOldId -or $_.email -eq $oldEmail }).Count) { throw 'Conta antiga ainda encontrada no Auth.' }
  Write-Output 'Concluido. Consulte as senhas em VER-ACESSOS.cmd.'
} finally {
  $password=$null; $credential=$null; $body=$null; $session=$null; $userHeaders=$null
  $keys=$null; $keyOutput=$null; $serverKey=$null; $adminHeaders=$null
}
