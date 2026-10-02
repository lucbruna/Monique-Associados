<#
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║     ⚖️  MONIQUE ADVOGADOS - Parar Sistema                     ║
  ║     v1.0.0                                                    ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
#>

$AppName = "⚖️ Monique Advogados"

function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

Clear-Host
Write-Color ""
Write-Color "  ╔═══════════════════════════════════════════════════════════════╗" "Red"
Write-Color "  ║                                                               ║" "Red"
Write-Color "  ║           🛑 $AppName - Parando Sistema                  ║" "Red"
Write-Color "  ║                                                               ║" "Red"
Write-Color "  ╚═══════════════════════════════════════════════════════════════╝" "Red"
Write-Color ""

# Parar processos Node.js
Write-Color "  🔍 Procurando processos Node.js..." "Yellow"
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $count = ($nodeProcesses | Measure-Object).Count
    Write-Color "  ⏹️   Encontrados $count processo(s) Node.js" "Yellow"
    
    # Parar processos do backend/frontend primeiro
    $backendPort = $null
    try {
        $backendConnections = netstat -ano | Select-String ":3001"
        if ($backendConnections) {
            $backendPort = $true
            Write-Color "     Backend (porta 3001) - Encontrado" "White"
        }
    } catch {}
    
    $frontendPort = $null
    try {
        $frontendConnections = netstat -ano | Select-String ":3000"
        if ($frontendConnections) {
            $frontendPort = $true
            Write-Color "     Frontend (porta 3000) - Encontrado" "White"
        }
    } catch {}
    
    # Finalizar
    foreach ($proc in $nodeProcesses) {
        try {
            $proc.Kill()
            Write-Color "     ✅ Processo PID $($proc.Id) finalizado" "Green"
        } catch {
            Write-Color "     ⚠️  Erro ao finalizar PID $($proc.Id): $($_.Exception.Message)" "Yellow"
        }
    }
    
    Write-Color "  ✅ Todos os processos Node.js finalizados" "Green"
} else {
    Write-Color "  ℹ️  Nenhum processo Node.js em execução" "Green"
}

# Forçar parada de tarefas cmd relacionadas
try {
    Get-Process | Where-Object { $_.MainWindowTitle -like "*Monique*" -or $_.MainWindowTitle -like "*Advogados*" } | ForEach-Object {
        try { $_.Kill() } catch {}
    }
} catch {}

Write-Color ""
Write-Color "  ╔═══════════════════════════════════════════════════════════════╗" "Green"
Write-Color "  ║                                                               ║" "Green"
Write-Color "  ║              ✅ SISTEMA PARADO COM SUCESSO!                   ║" "Green"
Write-Color "  ║                                                               ║" "Green"
Write-Color "  ╚═══════════════════════════════════════════════════════════════╝" "Green"
Write-Color ""
Write-Color "  Para reiniciar, execute: run.bat" "Cyan"
Write-Color ""
Write-Host "  Pressione ENTER para sair..." -NoNewline
$null = Read-Host
