<#
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║     ⚖️  MONIQUE ADVOGADOS - Compilador Profissional           ║
  ║     Converte scripts PowerShell em executáveis .exe           ║
  ║     v1.0.0                                                    ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
#>

$AppName = "Monique Advogados"
$AppVersion = "1.0.0"
$AppPublisher = "Monique Advogados"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrEmpty($ProjectRoot)) { $ProjectRoot = Get-Location }
$InstallerDir = "$ProjectRoot\installer"
$OutputDir = "$ProjectRoot\dist"
$IconFile = "$InstallerDir\monique.ico"

$scripts = @(
    @{Input="$InstallerDir\Instalador.ps1"; Output="$ProjectRoot\Instalador.exe"; Description="Instalador do Sistema"; NoConsole=$true},
    @{Input="$InstallerDir\run.ps1"; Output="$ProjectRoot\run.exe"; Description="Inicializador do Sistema"; NoConsole=$false},
    @{Input="$ProjectRoot\installer\stop.bat"; Output="$ProjectRoot\stop.exe"; Description="Parar Sistema"; NoConsole=$false}
)

function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

Clear-Host
Write-Color ""
Write-Color "  ╔═══════════════════════════════════════════════════════════════╗" "Cyan"
Write-Color "  ║                                                               ║" "Cyan"
Write-Color "  ║     ⚖️  $AppName - Compilador Profissional              ║" "Cyan"
Write-Color "  ║     Criando executáveis .exe a partir dos scripts            ║" "Cyan"
Write-Color "  ║                                                               ║" "Cyan"
Write-Color "  ╚═══════════════════════════════════════════════════════════════╝" "Cyan"
Write-Color ""

# Verificar ps2exe
Write-Color "  📦 Verificando ps2exe..." "Yellow"
try {
    Import-Module ps2exe -ErrorAction Stop
    Write-Color "  ✅ ps2exe $(Get-Module ps2exe | Select-Object -ExpandProperty Version)" "Green"
} catch {
    Write-Color "  ❌ ps2exe não encontrado. Instalando..." "Yellow"
    try {
        Install-Module -Name ps2exe -Force -SkipPublisherCheck -Scope CurrentUser -AllowClobber -ErrorAction Stop
        Import-Module ps2exe -ErrorAction Stop
        Write-Color "  ✅ ps2exe instalado" "Green"
    } catch {
        Write-Color "  ❌ Erro ao instalar ps2exe: $($_.Exception.Message)" "Red"
        Write-Host "  Pressione ENTER para sair..." -NoNewline
        $null = Read-Host
        exit 1
    }
}
Write-Color ""

# Verificar ícone
if (Test-Path $IconFile) {
    Write-Color "  ✅ Ícone encontrado: monique.ico" "Green"
} else {
    Write-Color "  ⚠️  Ícone não encontrado. Compilando sem ícone..." "Yellow"
    $IconFile = $null
}
Write-Color ""

# Criar diretório de saída
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Compilar scripts
Write-Color "  ⚙️  Compilando scripts..." "Cyan"
Write-Color "  ──────────────────────────────────────────────────────────────────" "DarkGray"

$successCount = 0
$errorCount = 0

foreach ($script in $scripts) {
    $inputFile = $script.Input
    $outputFile = $script.Output
    
    Write-Color "  📄 Script: $(Split-Path -Leaf $inputFile)" "White"
    Write-Color "     -> $(Split-Path -Leaf $outputFile)" "Gray"
    
    if (-not (Test-Path $inputFile)) {
        Write-Color "     ❌ Arquivo não encontrado: $inputFile" "Red"
        $errorCount++
        continue
    }
    
    try {
        $params = @{
            InputFile = $inputFile
            OutputFile = $outputFile
            Title = "$AppName - $($script.Description)"
            Description = "$($script.Description) v$AppVersion"
            Company = $AppPublisher
            Copyright = "2026 $AppPublisher"
            Version = $AppVersion
            RequireAdmin = if ($script.NoConsole) { $true } else { $false }
            NoConsole = $script.NoConsole
            ErrorAction = "Stop"
        }
        
        if ($IconFile -and (Test-Path $IconFile)) {
            $params.IconFile = $IconFile
        }
        
        ps2exe @params
        
        if (Test-Path $outputFile) {
            $size = (Get-Item $outputFile).Length
            Write-Color "     ✅ Compilado! ($([math]::Round($size/1KB)) KB)" "Green"
            $successCount++
            
            # Copiar para dist
            $distFile = "$OutputDir\$(Split-Path -Leaf $outputFile)"
            Copy-Item -Path $outputFile -Destination $distFile -Force
        }
    } catch {
        Write-Color "     ❌ Erro: $($_.Exception.Message)" "Red"
        $errorCount++
    }
    Write-Color ""
}

# Resultado final
Write-Color "  ──────────────────────────────────────────────────────────────────" "DarkGray"
Write-Color ""

if ($errorCount -eq 0) {
    Clear-Host
    Write-Color ""
    Write-Color "  ╔═══════════════════════════════════════════════════════════════╗" "Green"
    Write-Color "  ║                                                               ║" "Green"
    Write-Color "  ║           ✅ COMPILAÇÃO CONCLUÍDA COM SUCESSO!                ║" "Green"
    Write-Color "  ║                                                               ║" "Green"
    Write-Color "  ╚═══════════════════════════════════════════════════════════════╝" "Green"
    Write-Color ""
    Write-Color "  📁 $successCount executável(is) criado(s) em:" "White"
    Write-Color "     • $ProjectRoot\" "Cyan"
    Write-Color "     • $OutputDir\" "Cyan"
    Write-Color ""
    Write-Color "  📋 Arquivos gerados:" "White"
    Get-ChildItem -Path $ProjectRoot -Filter *.exe | ForEach-Object {
        $size = [math]::Round($_.Length/1KB)
        Write-Color "     • $($_.Name) ($size KB)" "Green"
    }
    Write-Color ""
    Write-Color "  🚀 Para distribuir, copie a pasta 'dist'" "Yellow"
    Write-Color "     contém todos os executáveis!" "Yellow"
} else {
    Write-Color "  ⚠️  $successCount sucesso(s), $errorCount erro(s)" "Yellow"
}

Write-Color ""
Write-Host "  Pressione ENTER para sair..." -NoNewline
$null = Read-Host
