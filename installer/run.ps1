<#
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║     ⚖️  MONIQUE ADVOGADOS - Inicializador do Sistema          ║
  ║     v1.0.0                                                    ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
#>

$AppName = "⚖️ Monique Advogados"
$InstallDir = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrEmpty($InstallDir)) { $InstallDir = Get-Location }
$BackendDir = "$InstallDir\backend"
$FrontendDir = "$InstallDir\frontend"
$BackendUrl = "http://localhost:3001"
$FrontendUrl = "http://localhost:3000"

function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Test-Node {
    try {
        $v = node --version 2>$null
        return $v
    } catch { return $null }
}

Clear-Host
Write-Color ""
Write-Color "  ╔═══════════════════════════════════════════════════════════════╗" "Cyan"
Write-Color "  ║                                                               ║" "Cyan"
Write-Color "  ║           ⚖️  $AppName - Inicializando Sistema           ║" "Cyan"
Write-Color "  ║                                                               ║" "Cyan"
Write-Color "  ╚═══════════════════════════════════════════════════════════════╝" "Cyan"
Write-Color ""

# Parar processos existentes nas portas 3000 e 3001
Write-Color "  🔍 Verificando portas..." "Yellow"
try {
    $connections = netstat -ano | Select-String -Pattern ":3001|:3000"
    foreach ($conn in $connections) {
        $parts = $conn -split '\s+'
        $pid = $parts[-1]
        if ($pid -match '^\d+$') {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 1
    Write-Color "  ✅ Portas liberadas" "Green"
} catch {
    Write-Color "  ⚠️  Nao foi possivel verificar portas" "Yellow"
}
Write-Color ""

# Verificar Node.js
$nodeVer = Test-Node
if (-not $nodeVer) {
    Write-Color "  ❌ Node.js não encontrado!" "Red"
    Write-Color "  📥 Baixe em: https://nodejs.org" "White"
    Write-Host ""
    Write-Host "  Pressione ENTER para sair..." -NoNewline
    $null = Read-Host
    exit 1
}
Write-Color "  ✅ Node.js $nodeVer" "Green"
Write-Color ""

# Verificar dependências
if (-not (Test-Path "$BackendDir\node_modules")) {
    Write-Color "  📦 Instalando dependências do backend..." "Yellow"
    try {
        Set-Location $BackendDir
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm install --legacy-peer-deps --no-audit --no-fund" -Wait -NoNewWindow -PassThru | Out-Null
        Write-Color "  ✅ Backend instalado" "Green"
    } catch {
        Write-Color "  ❌ Erro ao instalar backend" "Red"
    }
}

if (-not (Test-Path "$FrontendDir\node_modules")) {
    Write-Color "  📦 Instalando dependências do frontend..." "Yellow"
    try {
        Set-Location $FrontendDir
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm install --legacy-peer-deps --no-audit --no-fund" -Wait -NoNewWindow -PassThru | Out-Null
        Write-Color "  ✅ Frontend instalado" "Green"
    } catch {
        Write-Color "  ❌ Erro ao instalar frontend" "Red"
    }
}
Write-Color ""

# Verificar banco de dados
if (-not (Test-Path "$BackendDir\prisma\dev.db")) {
    Write-Color "  🗄️  Configurando banco de dados..." "Yellow"
    try {
        Set-Location $BackendDir
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx prisma migrate dev --name init" -Wait -NoNewWindow -PassThru | Out-Null
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx prisma db seed" -Wait -NoNewWindow -PassThru | Out-Null
        Write-Color "  ✅ Banco configurado" "Green"
    } catch {
        Write-Color "  ❌ Erro ao configurar banco" "Red"
    }
    Write-Color ""
}

# Iniciar backend
Write-Color "  🚀 Iniciando backend em $BackendUrl ..." "Green"
try {
    $backendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/k title $AppName - Backend && cd /d `"$BackendDir`" && npm run dev" -PassThru -WindowStyle Normal
    Write-Color "  ✅ Backend iniciado (PID: $($backendProcess.Id))" "Green"
} catch {
    Write-Color "  ❌ Erro ao iniciar backend" "Red"
}

Write-Color "  ⏳ Aguardando backend..." "Yellow"
Start-Sleep -Seconds 8

# Verificar backend
$backendReady = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

if ($backendReady) {
    Write-Color "  ✅ Backend pronto!" "Green"
} else {
    Write-Color "  ⚠️  Backend pode ainda estar iniciando..." "Yellow"
}
Write-Color ""

# Iniciar frontend
Write-Color "  🌐 Iniciando frontend em $FrontendUrl ..." "Green"
try {
    $frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/k title $AppName - Frontend && cd /d `"$FrontendDir`" && npm run dev" -PassThru -WindowStyle Normal
    Write-Color "  ✅ Frontend iniciado (PID: $($frontendProcess.Id))" "Green"
} catch {
    Write-Color "  ❌ Erro ao iniciar frontend" "Red"
}

Write-Color "  ⏳ Aguardando frontend..." "Yellow"
Start-Sleep -Seconds 10

# Mensagem final
Clear-Host
Write-Color ""
Write-Color "  ╔═══════════════════════════════════════════════════════════════╗" "Green"
Write-Color "  ║                                                               ║" "Green"
Write-Color "  ║              ✅ SISTEMA INICIADO COM SUCESSO!                 ║" "Green"
Write-Color "  ║                                                               ║" "Green"
Write-Color "  ╚═══════════════════════════════════════════════════════════════╝" "Green"
Write-Color ""
Write-Color "  🌐  ACESSE: $FrontendUrl" "Green"
Write-Color "  🔗  Backend: $BackendUrl" "Cyan"
Write-Color ""
Write-Color "  📋 CREDENCIAIS:" "White"
Write-Color "  ───────────────────────────────────────" "DarkGray"
Write-Color "    👑 Admin: monique@moniqueadvogados.com" "Yellow"
Write-Color "    🔑 Senha: senha123" "White"
Write-Color "  ───────────────────────────────────────" "DarkGray"
Write-Color ""
Write-Color "  ⚠️  Para parar o sistema, feche as janelas ou execute stop.bat" "Yellow"
Write-Color ""
Write-Color "  🌐 Abrindo navegador automaticamente..." "Green"
Start-Sleep -Seconds 2

try {
    Start-Process "http://localhost:3000"
} catch {}

Write-Color ""
Write-Host "  Pressione ENTER para fechar esta janela..." -NoNewline
$null = Read-Host

exit 0
