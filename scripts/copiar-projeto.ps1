$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $projectRoot 'copias'
$excludedDirectories = @('node_modules', '.tools', '.expo', '.git', '.supabase', 'dist', 'web-build', 'coverage', 'test-results', 'playwright-report', 'copias', 'android', 'ios')
$excludedFiles = @('expo-env.d.ts', 'credentials.json')

function Get-ProjectFiles([string]$Directory) {
  foreach ($item in Get-ChildItem -LiteralPath $Directory -Force) {
    if ($item.PSIsContainer) {
      if ($item.Name -in $excludedDirectories) { continue }
      if ($item.Name -eq '.temp' -and $Directory -eq (Join-Path $projectRoot 'supabase')) { continue }
      if ($item.LinkType -eq 'SymbolicLink' -or $item.LinkType -eq 'Junction') { continue }
      Get-ProjectFiles $item.FullName
    } else {
      if ($item.Name -in $excludedFiles) { continue }
      if (($item.Name -eq '.env' -or $item.Name -like '.env.*') -and $item.Name -ne '.env.example') { continue }
      if ($item.Extension -in @('.log', '.keystore', '.jks', '.apk', '.aab', '.dpapi')) { continue }
      $item
    }
  }
}

$null = New-Item -ItemType Directory -Path $outputDirectory -Force
$archivePath = Join-Path $outputDirectory ('HashimotoFrota_' + (Get-Date -Format 'yyyyMMdd_HHmmssfff') + '.zip')
$files = @(Get-ProjectFiles $projectRoot)
Add-Type -AssemblyName System.IO.Compression
$archiveStream = [System.IO.File]::Open($archivePath, [System.IO.FileMode]::CreateNew)
try {
  $archive = New-Object System.IO.Compression.ZipArchive($archiveStream, [System.IO.Compression.ZipArchiveMode]::Create, $true)
  try {
    foreach ($file in $files) {
      $relativePath = $file.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
      $entry = $archive.CreateEntry(('HashimotoFrota/' + $relativePath), [System.IO.Compression.CompressionLevel]::Optimal)
      $inputStream = $file.OpenRead()
      try {
        $entryStream = $entry.Open()
        try { $inputStream.CopyTo($entryStream) } finally { $entryStream.Dispose() }
      } finally { $inputStream.Dispose() }
    }
  } finally { $archive.Dispose() }
} finally { $archiveStream.Dispose() }

$size = (Get-Item -LiteralPath $archivePath).Length
Write-Output ('Copia criada: ' + $archivePath)
Write-Output ('Arquivos: ' + $files.Count + ' | Tamanho: ' + [math]::Round($size / 1MB, 2) + ' MB')
Write-Output 'Para usar a copia: extraia o ZIP, execute npm.cmd ci e configure o .env a partir do .env.example.'
Write-Output 'As senhas locais, caches e dependencias instaladas ficam fora da copia.'
