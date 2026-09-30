param([switch]$Verificar)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$project = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $taskRoot '.tools/supabase-project.json') | ConvertFrom-Json
if ($project.id -ne 'qxkhjlkexsjgkttdugqt') { throw 'Projeto diferente do esperado.' }
$pooler = [Uri]((Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $taskRoot 'supabase/.temp/pooler-url')).Trim())
$dbUser = [Uri]::UnescapeDataString(($pooler.UserInfo -split ':',2)[0])
$securePassword = ConvertTo-SecureString -String ((Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $taskRoot '.tools/supabase-frota-db-password.dpapi')).Trim())
$credential = New-Object System.Management.Automation.PSCredential($dbUser, $securePassword)
try {
  $dbPassword = $credential.GetNetworkCredential().Password
  if ([string]::IsNullOrWhiteSpace($dbPassword)) { throw 'Senha local indisponivel.' }
  if ($Verificar) {
    Write-Output 'Configuracao e senha protegida acessiveis no Windows atual; nenhum segredo exibido.'
    return
  }
  Write-Host 'HASHI APP - Acesso administrativo ao PostgreSQL'
  Write-Host ''
  Write-Host ('Projeto: ' + $project.name)
  Write-Host ('Painel: https://supabase.com/dashboard/project/' + $project.id)
  Write-Host ('Host (Session pooler): ' + $pooler.Host)
  Write-Host ('Porta: ' + $pooler.Port)
  Write-Host ('Banco: ' + $pooler.AbsolutePath.TrimStart('/'))
  Write-Host ('Usuario: ' + $dbUser)
  Write-Host ('Senha salva localmente: ' + $dbPassword)
  Write-Host 'SSL: require'
  Write-Host 'Schema operacional: public'
  Write-Host ''
  Write-Host 'Connection string (senha ja codificada para URL):'
  Write-Host ('postgresql://' + [Uri]::EscapeDataString($dbUser) + ':' + [Uri]::EscapeDataString($dbPassword) + '@' + $pooler.Host + ':' + $pooler.Port + '/postgres?sslmode=require')
  Write-Host ''
  Write-Host 'Este e o acesso administrativo do banco, diferente do login do aplicativo.'
  Write-Host 'Use a senha apenas em ferramenta de banco ou no servidor, nunca no codigo do navegador.'
  Write-Host 'Se a senha foi alterada no painel Supabase, esta copia local pode estar desatualizada.'
  $null = Read-Host 'Pressione Enter para limpar a tela e fechar'
  Clear-Host
} finally {
  $dbPassword = $null
  $credential = $null
  $securePassword = $null
}
