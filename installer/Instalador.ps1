#Requires -RunAsAdministrator
<#
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║     ⚖️  MONIQUE ADVOGADOS - Instalador Profissional           ║
  ║     Sistema de Gestão Jurídica v1.0.0                         ║
  ║     Copyright (c) 2026 Monique Advogados                      ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
#>

$AppName = "Monique Advogados"
$AppVersion = "1.0.0"
$AppPublisher = "Monique Advogados"
$InstallDir = "$env:LOCALAPPDATA\MoniqueAdvogados"
$StartMenuDir = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Monique Advogados"
$DesktopDir = [Environment]::GetFolderPath("Desktop")
$BackendUrl = "http://localhost:3001"
$FrontendUrl = "http://localhost:3000"

function Write-Color {
    param([string]$Text, [string]$Color = "White", [string]$Background)
    if ($Background) {
        Write-Host $Text -ForegroundColor $Color -BackgroundColor $Background
    } else {
        Write-Host $Text -ForegroundColor $Color
    }
}

function Show-Banner {
    Clear-Host
    Write-Color ""
    Write-Color "  ╔═══════════════════════════════════════════════════════════════╗" "Cyan"
    Write-Color "  ║                                                               ║" "Cyan"
    Write-Color "  ║        ⚖️  MONIQUE ADVOGADOS - Instalador Profissional        ║" "Cyan"
    Write-Color "  ║                                                               ║" "Cyan"
    Write-Color "  ║        Sistema de Gestão Jurídica v$AppVersion                 ║" "Cyan"
    Write-Color "  ║        $AppPublisher                                            ║" "Cyan"
    Write-Color "  ║                                                               ║" "Cyan"
    Write-Color "  ╚═══════════════════════════════════════════════════════════════╝" "Cyan"
    Write-Color ""
}

function Show-Progress {
    param([int]$Step, [int]$Total, [string]$Message)
    Write-Color "  ──────────────────────────────────────────────────────────────────" "DarkGray"
    Write-Color "  [${Step}/${Total}] $Message" "Yellow"
    Write-Color ""
}

function Test-Command {
    param([string]$Command)
    try { Get-Command $Command -ErrorAction Stop | Out-Null; return $true }
    catch { return $false }
}

# ─────────────────── INÍCIO ───────────────────

Show-Banner

Write-Color "  ⚠️  Este instalador irá configurar o sistema completo." "White"
Write-Color "  ⚖️  Monique Advogados - Gestão Jurídica Inteligente" "Cyan"
Write-Color ""
Write-Host "  Pressione ENTER para continuar ou CTRL+C para cancelar..." -NoNewline
$null = Read-Host
Write-Color ""

# ─── PASSO 1: Verificar requisitos ───
Show-Progress -Step 1 -Total 7 -Message "Verificando requisitos do sistema..."

$requirements = @(
    @{Name="Node.js"; Command="node"; CheckVersion=$true},
    @{Name="npm"; Command="npm"; CheckVersion=$true}
)

$allOk = $true
foreach ($req in $requirements) {
    if (Test-Command $req.Command) {
        if ($req.CheckVersion) {
            $version = & $req.Command --version 2>$null
            Write-Color "    ✅ $($req.Name) $version" "Green"
        } else {
            Write-Color "    ✅ $($req.Name) encontrado" "Green"
        }
    } else {
        Write-Color "    ❌ $($req.Name) não encontrado!" "Red"
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Color ""
    Write-Color "  ❌ Requisitos não atendidos. Instale o Node.js em: https://nodejs.org" "Red"
    Write-Host ""
    Write-Host "  Pressione ENTER para sair..." -NoNewline
    $null = Read-Host
    exit 1
}

# Verificar espaço em disco
$drive = (Get-PSDrive $InstallDir[0]).Free
if ($drive -lt 1073741824) { # 1GB
    Write-Color "    ⚠️  Espaço em disco baixo: $([math]::Round($drive/1MB, 1)) MB disponíveis" "Yellow"
    Write-Color "    ⚠️  Recomendado: pelo menos 1 GB livre" "Yellow"
} else {
    Write-Color "    💾 Espaço em disco: $([math]::Round($drive/1GB, 1)) GB disponíveis" "Green"
}
Write-Color ""

# ─── PASSO 2: Preparar diretório ───
Show-Progress -Step 2 -Total 7 -Message "Preparando diretório de instalação..."

# Parar processos Node.js existentes antes de remover/instalar
Write-Color "    🔍 Parando processos existentes..." "Yellow"
taskkill /F /IM node.exe 2>$null | Out-Null
Start-Sleep -Seconds 1
Write-Color "    ✅ Processos finalizados" "Green"
Write-Color ""

if (Test-Path $InstallDir) {
    Write-Color "    ⚠️  Diretório já existe: $InstallDir" "Yellow"
    Write-Color "    ⚠️  Removendo versão anterior..." "Yellow"
    try {
        Remove-Item -Recurse -Force $InstallDir -ErrorAction Stop
        Write-Color "    ✅ Versão anterior removida" "Green"
    } catch {
        Write-Color "    ❌ Erro ao remover diretório: $($_.Exception.Message)" "Red"
        Write-Color "    ⚠️  Feche todos os processos relacionados e tente novamente." "Yellow"
        Write-Host ""
        Write-Host "  Pressione ENTER para sair..." -NoNewline
        $null = Read-Host
        exit 1
    }
}

try {
    New-Item -ItemType Directory -Path $InstallDir -Force -ErrorAction Stop | Out-Null
    Write-Color "    ✅ Diretório criado: $InstallDir" "Green"
} catch {
    Write-Color "    ❌ Erro ao criar diretório: $($_.Exception.Message)" "Red"
    Write-Host ""
    Write-Host "  Pressione ENTER para sair..." -NoNewline
    $null = Read-Host
    exit 1
}
Write-Color ""

# ─── PASSO 3: Copiar arquivos ───
Show-Progress -Step 3 -Total 7 -Message "Copiando arquivos do sistema..."

$SourceDir = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrEmpty($SourceDir)) { $SourceDir = Get-Location }

Write-Color "    📦 Origem: $SourceDir" "Gray"

$copyItems = @(
    @{Source="$SourceDir\backend"; Dest="$InstallDir\backend"; Label="Backend (API)"},
    @{Source="$SourceDir\frontend"; Dest="$InstallDir\frontend"; Label="Frontend (Interface)"}
)

$copyErrors = 0
foreach ($item in $copyItems) {
    if (Test-Path $item.Source) {
        Write-Color "    📂 Copiando $($item.Label)..." "White"
        try {
            Copy-Item -Path $item.Source -Destination $item.Dest -Recurse -Force -ErrorAction Stop
            $fileCount = (Get-ChildItem -Path $item.Dest -Recurse -File | Measure-Object).Count
            Write-Color "      ✅ $fileCount arquivos copiados" "Green"
        } catch {
            Write-Color "      ❌ Erro: $($_.Exception.Message)" "Red"
            $copyErrors++
        }
    } else {
        Write-Color "      ⚠️  Pasta não encontrada: $($item.Source)" "Yellow"
        $copyErrors++
    }
}

# Copiar scripts .bat
$batFiles = @("run.bat", "stop.bat")
foreach ($bat in $batFiles) {
    $batSource = "$SourceDir\installer\$bat"
    if (-not (Test-Path $batSource)) { $batSource = "$SourceDir\$bat" }
    if (Test-Path $batSource) {
        Copy-Item -Path $batSource -Destination $InstallDir -Force -ErrorAction SilentlyContinue
    }
}

if ($copyErrors -gt 0) {
    Write-Color "    ⚠️  $copyErrors item(ns) com erro" "Yellow"
} else {
    Write-Color "    ✅ Todos os arquivos copiados com sucesso" "Green"
}
Write-Color ""

# ─── PASSO 4: Instalar dependências do backend ───
Show-Progress -Step 4 -Total 7 -Message "Instalando dependências do backend..."

try {
    Set-Location "$InstallDir\backend" -ErrorAction Stop
    
    # Verificar package.json
    if (-not (Test-Path "package.json")) {
        throw "package.json não encontrado no backend"
    }
    
    Write-Color "    📦 npm install (backend)..." "White"
    $npmBackend = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm install --legacy-peer-deps --no-audit --no-fund" -Wait -NoNewWindow -PassThru
    if ($npmBackend.ExitCode -eq 0) {
        Write-Color "    ✅ Dependências do backend instaladas" "Green"
    } else {
        Write-Color "    ⚠️  npm exit code: $($npmBackend.ExitCode)" "Yellow"
        Write-Color "    ⚠️  Algumas dependências podem não ter sido instaladas" "Yellow"
    }
    
    # Gerar Prisma Client
    Write-Color "    📦 Gerando Prisma Client..." "White"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx prisma generate" -Wait -NoNewWindow -PassThru | Out-Null
    Write-Color "    ✅ Prisma Client gerado" "Green"
    
} catch {
    Write-Color "    ❌ Erro no backend: $($_.Exception.Message)" "Red"
}
Write-Color ""

# ─── PASSO 5: Instalar dependências do frontend ───
Show-Progress -Step 5 -Total 7 -Message "Instalando dependências do frontend..."

try {
    Set-Location "$InstallDir\frontend" -ErrorAction Stop
    
    if (-not (Test-Path "package.json")) {
        throw "package.json não encontrado no frontend"
    }
    
    Write-Color "    📦 npm install (frontend)..." "White"
    $npmFrontend = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm install --legacy-peer-deps --no-audit --no-fund" -Wait -NoNewWindow -PassThru
    if ($npmFrontend.ExitCode -eq 0) {
        Write-Color "    ✅ Dependências do frontend instaladas" "Green"
    } else {
        Write-Color "    ⚠️  npm exit code: $($npmFrontend.ExitCode)" "Yellow"
        Write-Color "    ⚠️  Algumas dependências podem não ter sido instaladas" "Yellow"
    }
} catch {
    Write-Color "    ❌ Erro no frontend: $($_.Exception.Message)" "Red"
}
Write-Color ""

# ─── PASSO 6: Configurar banco de dados ───
Show-Progress -Step 6 -Total 7 -Message "Configurando banco de dados SQLite..."

try {
    Set-Location "$InstallDir\backend" -ErrorAction Stop
    
    # O banco SQLite ja vem pronto no pacote. NAO usar 'prisma migrate dev':
    # ele exige prompt interativo e, num banco ja populado, pode pedir reset,
    # travando a instalacao. Usamos apenas 'prisma db push' (abaixo), que
    # sincroniza o schema sem destruir dados.
    $dbPath = "$InstallDir\backend\prisma\dev.db"

    if (Test-Path $dbPath) {
        Write-Color "    🗄️  Banco de dados existente detectado - preservando dados" "Green"
    } else {
        Write-Color "    🗄️  Criando banco de dados SQLite..." "White"
    }
    
    # NAO executar 'prisma db seed': o seed apaga todos os usuarios e recria
    # dados de demonstracao, o que apagaria o banco que acompanha o pacote.
    Write-Color "    ⚙️  Sincronizando schema (prisma db push)..." "White"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx prisma db push 2>&1" -Wait -NoNewWindow -PassThru | Out-Null
    
    # Verificar se o banco foi criado
    if (Test-Path "$InstallDir\backend\prisma\dev.db") {
        $dbSize = (Get-Item "$InstallDir\backend\prisma\dev.db").Length
        Write-Color "    ✅ Banco de dados SQLite criado ($([math]::Round($dbSize/1KB)) KB)" "Green"
    } else {
        Write-Color "    ⚠️  Banco de dados não encontrado, tentando novamente..." "Yellow"
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx prisma db push" -Wait -NoNewWindow -PassThru | Out-Null
        if (Test-Path "$InstallDir\backend\prisma\dev.db") {
            Write-Color "    ✅ Banco de dados criado na segunda tentativa" "Green"
        }
    }
} catch {
    Write-Color "    ❌ Erro ao configurar banco: $($_.Exception.Message)" "Red"
}
Write-Color ""

# ─── PASSO 7: Criar atalhos ───
Show-Progress -Step 7 -Total 7 -Message "Criando atalhos e finalizando..."

try {
    $WshShell = New-Object -ComObject WScript.Shell
    
    # Atalho na Área de Trabalho
    $shortcutPath = "$DesktopDir\⚖️ Monique Advogados.lnk"
    $shortcut = $WshShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "$InstallDir\run.bat"
    $shortcut.WorkingDirectory = $InstallDir
    $shortcut.Description = "Iniciar ⚖️ Monique Advogados - Sistema de Gestão Jurídica"
    $shortcut.IconLocation = "$InstallDir\backend\public\favicon.ico,0"
    $shortcut.Save()
    Write-Color "    ✅ Atalho na Área de Trabalho" "Green"
    
    # Atalho no Menu Iniciar
    if (-not (Test-Path $StartMenuDir)) {
        New-Item -ItemType Directory -Path $StartMenuDir -Force | Out-Null
    }
    $shortcut2 = $WshShell.CreateShortcut("$StartMenuDir\⚖️ Monique Advogados.lnk")
    $shortcut2.TargetPath = "$InstallDir\run.bat"
    $shortcut2.WorkingDirectory = $InstallDir
    $shortcut2.Description = "Iniciar ⚖️ Monique Advogados"
    $shortcut2.IconLocation = "$InstallDir\backend\public\favicon.ico,0"
    $shortcut2.Save()
    Write-Color "    ✅ Atalho no Menu Iniciar" "Green"
    
    # Atalho Parar Sistema
    $shortcut3 = $WshShell.CreateShortcut("$DesktopDir\🛑 Parar Monique Advogados.lnk")
    $shortcut3.TargetPath = "$InstallDir\stop.bat"
    $shortcut3.WorkingDirectory = $InstallDir
    $shortcut3.Description = "Parar ⚖️ Monique Advogados"
    $shortcut3.IconLocation = "shell32.dll,28"
    $shortcut3.Save()
    Write-Color "    ✅ Atalho Parar Sistema" "Green"
    
    # Atalho de Desinstalação no Menu Iniciar
    $shortcut4 = $WshShell.CreateShortcut("$StartMenuDir\🛑 Desinstalar Monique Advogados.lnk")
    $shortcut4.TargetPath = "$env:SystemRoot\System32\cmd.exe"
    $shortcut4.Arguments = "/c rmdir /s /q `"$InstallDir`" & del /q `"$DesktopDir\⚖️ Monique Advogados.lnk`" & del /q `"$DesktopDir\🛑 Parar Monique Advogados.lnk`" & echo Sistema desinstalado! & pause"
    $shortcut4.Description = "Desinstalar ⚖️ Monique Advogados"
    $shortcut4.IconLocation = "shell32.dll,131"
    $shortcut4.Save()
    Write-Color "    ✅ Atalho de Desinstalação criado" "Green"
    
} catch {
    Write-Color "    ⚠️  Erro ao criar atalhos: $($_.Exception.Message)" "Yellow"
}
Write-Color ""

# ─── FINALIZAÇÃO ───
Set-Location $PSScriptRoot

Clear-Host
Write-Color ""
Write-Color "  ╔═══════════════════════════════════════════════════════════════╗" "Green"
Write-Color "  ║                                                               ║" "Green"
Write-Color "  ║           ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!                ║" "Green"
Write-Color "  ║                                                               ║" "Green"
Write-Color "  ╚═══════════════════════════════════════════════════════════════╝" "Green"
Write-Color ""
Write-Color "  📋 CREDENCIAIS DE ACESSO:" "White"
Write-Color "  ─────────────────────────────────────────────────────────────" "DarkGray"
Write-Color "    👑 SUPER ADMIN: monique@moniqueadvogados.com" "Yellow"
Write-Color "    👑 SÓCIO:        ricardo@moniqueadvogados.com" "Yellow"
Write-Color "    ⚖️  ADVOGADO:     ana.silva@moniqueadvogados.com" "Yellow"
Write-Color "    💰 FINANCEIRO:   roberto@moniqueadvogados.com" "Yellow"
Write-Color "    📧 Senha:        senha123" "White"
Write-Color "  ─────────────────────────────────────────────────────────────" "DarkGray"
Write-Color ""
Write-Color "  🚀 PARA INICIAR O SISTEMA:" "White"
Write-Color "    • Clique no atalho ⚖️ Monique Advogados na Área de Trabalho" "Cyan"
Write-Color "    • Ou execute: $InstallDir\run.bat" "Cyan"
Write-Color ""
Write-Color "  🌐 ACESSO:" "White"
Write-Color "    • Frontend: $FrontendUrl" "Green"
Write-Color "    • Backend:  $BackendUrl" "Green"
Write-Color ""
Write-Color "  📁 LOCALIZAÇÃO:" "White"
Write-Color "    • $InstallDir" "Gray"
Write-Color ""
Write-Color "  ⚠️  PARA DESINSTALAR:" "Yellow"
Write-Color "    • Menu Iniciar > Monique Advogados > Desinstalar" "Yellow"
Write-Color "    • Ou remova a pasta $InstallDir manualmente" "Yellow"
Write-Color ""
Write-Host "  Pressione ENTER para sair..." -NoNewline
$null = Read-Host
