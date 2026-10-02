$AppName = "Monique Advogados"
$AppVersion = "1.0.0"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DistDir = "$ProjectRoot\dist"
$PackageBase = "MoniqueAdvogados_$AppVersion"
$PackageDir = "$DistDir\$PackageBase"

function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

Clear-Host
Write-Color "" "Cyan"
Write-Color "  =========================================================" "Cyan"
Write-Color "        $AppName - Empacotador" "Cyan"
Write-Color "        Criando pacote completo para distribuicao" "Cyan"
Write-Color "        v$AppVersion" "Cyan"
Write-Color "  =========================================================" "Cyan"
Write-Color "" "Cyan"

if (Test-Path $DistDir) {
    Write-Color "  Removendo pacote anterior..." "Yellow"
    Remove-Item -Recurse -Force $DistDir -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path $PackageDir -Force | Out-Null
New-Item -ItemType Directory -Path "$PackageDir\backend" -Force | Out-Null
New-Item -ItemType Directory -Path "$PackageDir\frontend" -Force | Out-Null
New-Item -ItemType Directory -Path "$PackageDir\installer" -Force | Out-Null
Write-Color "  Estrutura de pastas criada" "Green"
Write-Color "" "White"

Write-Color "  Copiando arquivos..." "Yellow"

$exeFiles = @("Instalador.exe", "run.exe", "stop.exe")
foreach ($exe in $exeFiles) {
    $src = "$ProjectRoot\$exe"
    $dst = "$PackageDir\$exe"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Force
        Write-Color "    OK: $exe" "Green"
    } else {
        Write-Color "    Arquivo nao encontrado: $exe" "Yellow"
    }
}

$backendItems = Get-ChildItem -Path "$ProjectRoot\backend" -Exclude "node_modules" | ForEach-Object { $_.Name }
foreach ($item in $backendItems) {
    $src = "$ProjectRoot\backend\$item"
    $dst = "$PackageDir\backend\$item"
    if (Test-Path $src -PathType Container) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
    } else {
        Copy-Item -Path $src -Destination $dst -Force
    }
}
Write-Color "    OK: Backend" "Green"

$frontendItems = Get-ChildItem -Path "$ProjectRoot\frontend" -Exclude "node_modules", "dist" | ForEach-Object { $_.Name }
foreach ($item in $frontendItems) {
    $src = "$ProjectRoot\frontend\$item"
    $dst = "$PackageDir\frontend\$item"
    if (Test-Path $src -PathType Container) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
    } else {
        Copy-Item -Path $src -Destination $dst -Force
    }
}
Write-Color "    OK: Frontend" "Green"

$icoSrc = "$ProjectRoot\installer\monique.ico"
if (Test-Path $icoSrc) {
    Copy-Item -Path $icoSrc -Destination "$PackageDir\installer\monique.ico" -Force
    Write-Color "    OK: Icone" "Green"
}

Write-Color "" "White"
Write-Color "  Gerando LEIA-ME.txt..." "Yellow"

$readmeContent = @"
============================================================
   MONIQUE ADVOGADOS - Sistema de Gestao Juridica
   v$AppVersion
============================================================

REQUISITOS
------------------------------------------------------------
- Windows 10/11
- Node.js 18+ (https://nodejs.org)
- 1 GB de espaco livre em disco
- Conexao com internet (para npm install)

INSTALACAO RAPIDA
------------------------------------------------------------
1. Execute Instalador.exe COMO ADMINISTRADOR
2. Aguarde a instalacao completa (~15 minutos)
3. Pronto! O sistema estara instalado

CREDENCIAIS DE ACESSO
------------------------------------------------------------
SUPER ADMIN: monique@moniqueadvogados.com
SOCIO:        ricardo@moniqueadvogados.com
ADVOGADO:     ana.silva@moniqueadvogados.com
FINANCEIRO:   roberto@moniqueadvogados.com

Senha para todos: senha123

APOS INICIAR
------------------------------------------------------------
Acesse: http://localhost:3000

ESTRUTURA DO PACOTE
------------------------------------------------------------
MoniqueAdvogados_$AppVersion/
  Instalador.exe     - Instalador profissional
  run.exe            - Iniciar o sistema
  stop.exe           - Parar o sistema
  backend/           - API do sistema
  frontend/          - Interface do sistema

INSTALACAO MANUAL
------------------------------------------------------------
1. Copie a pasta para o local desejado
2. No backend: npm install --legacy-peer-deps
3. No frontend: npm install --legacy-peer-deps
4. No backend: npx prisma migrate dev --name init
5. No backend: npx prisma db seed
6. Execute run.exe para iniciar

SUPORTE
------------------------------------------------------------
Email: contato@moniqueadvogados.com
Site: https://moniqueadvogados.com

Monique Advogados - Gestao Juridica Inteligente
"@

$readmePath = "$PackageDir\LEIA-ME.txt"
[System.IO.File]::WriteAllText($readmePath, $readmeContent, [System.Text.Encoding]::UTF8)
Write-Color "    OK: LEIA-ME.txt" "Green"

Write-Color "" "White"
Write-Color "  Compactando pacote ZIP..." "Yellow"

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = "$DistDir\$PackageBase.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($PackageDir, $zipPath)

$zipSize = (Get-Item $zipPath).Length
$folderSize = (Get-ChildItem -Path $PackageDir -Recurse -File | Measure-Object -Property Length -Sum).Sum

Clear-Host
Write-Color "" "Green"
Write-Color "  =========================================================" "Green"
Write-Color "        PACOTE CRIADO COM SUCESSO!" "Green"
Write-Color "  =========================================================" "Green"
Write-Color "" "Green"

Write-Color "  Pasta destino: $DistDir" "Cyan"
Write-Color "" "White"

Write-Color "  Arquivos gerados:" "White"

$exeList = Get-ChildItem -Path $PackageDir -Filter *.exe
foreach ($exe in $exeList) {
    $sizeKB = [math]::Round($exe.Length/1KB)
    Write-Color "    $($exe.Name) ($sizeKB KB)" "Green"
}

Write-Color "    LEIA-ME.txt" "Green"
Write-Color "" "White"

$zipSizeMB = [math]::Round($zipSize/1MB, 1)
$folderSizeMB = [math]::Round($folderSize/1MB, 1)

Write-Color "  ZIP: $PackageBase.zip ($zipSizeMB MB)" "Yellow"
Write-Color "  Pasta: $PackageBase ($folderSizeMB MB em disco)" "Yellow"
Write-Color "" "White"

Write-Color "  Para distribuir:" "White"
Write-Color "    Copie a pasta $PackageDir para o cliente" "Cyan"
Write-Color "    ou envie o arquivo ZIP completo" "Cyan"
Write-Color "" "White"

Write-Host "  Pressione ENTER para sair..."
$null = Read-Host
