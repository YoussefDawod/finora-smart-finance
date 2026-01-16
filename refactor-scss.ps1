param(
    [string[]]$FilePaths,
    [switch]$NoBackup = $false
)

if ($FilePaths.Count -eq 0) {
    Write-Host "SCSS Refactoring Script"
    Write-Host "======================"
    Write-Host ""
    Write-Host "Usage: .\refactor-scss.ps1 <file1.scss> [<file2.scss> ...] [-NoBackup]"
    Write-Host ""
    Write-Host "This script refactors SCSS files to:"
    Write-Host "  1. Add @use '@/styles/mixins' import (if missing)"
    Write-Host "  2. Replace @media queries with mixin includes"
    Write-Host "  3. Replace hardcoded rgba colors with CSS variables"
    Write-Host ""
    Write-Host "Example:"
    Write-Host "  .\refactor-scss.ps1 'src/styles/themes/light.scss' 'src/styles/components/button.scss'"
    Write-Host ""
    exit 1
}

$processedCount = 0
$errorCount = 0
$replacementSummary = @{}

foreach ($filePath in $FilePaths) {
    $filePath = Resolve-Path $filePath -ErrorAction SilentlyContinue
    
    if (-not $filePath) {
        Write-Host "✗ ERROR: File not found - $filePath"
        $errorCount++
        continue
    }

    $fileName = Split-Path $filePath -Leaf
    
    try {
        # Create backup unless NoBackup flag is set
        if (-not $NoBackup) {
            $backupPath = "$filePath.backup"
            Copy-Item $filePath $backupPath -Force
        }

        # Read file content preserving encoding and line endings
        $content = Get-Content $filePath -Raw -Encoding UTF8
        $originalContent = $content

        # Track changes
        $changesApplied = @()

        # =============================================
        # 1. Add @use '@/styles/mixins' if missing
        # =============================================
        if ($content -match "@use\s+['\"]@/styles/variables['\"]") {
            if ($content -notmatch "@use\s+['\"]@/styles/mixins['\"]") {
                $content = $content -replace "(@use\s+['\"]@/styles/variables['\"]\s+as\s+\*;)", "`$1`n@use '@/styles/mixins' as *;"
                $changesApplied += "Added mixins import"
            }
        }

        # =============================================
        # 2. Replace @media queries with mixin includes
        # =============================================
        
        # @media (max-width: var(--bp-lg)) -> @include desktop
        if ($content -match "@media\s*\(\s*max-width:\s*var\(--bp-lg\)") {
            $content = $content -replace "@media\s*\(\s*max-width:\s*var\(--bp-lg\)\s*\)", "@include desktop"
            $changesApplied += "Replaced: @media (max-width: var(--bp-lg)) → @include desktop"
        }

        # @media (max-width: var(--bp-md)) -> @include tablet
        if ($content -match "@media\s*\(\s*max-width:\s*var\(--bp-md\)") {
            $content = $content -replace "@media\s*\(\s*max-width:\s*var\(--bp-md\)\s*\)", "@include tablet"
            $changesApplied += "Replaced: @media (max-width: var(--bp-md)) → @include tablet"
        }

        # @media (max-width: var(--bp-sm)) -> @include mobile
        if ($content -match "@media\s*\(\s*max-width:\s*var\(--bp-sm\)") {
            $content = $content -replace "@media\s*\(\s*max-width:\s*var\(--bp-sm\)\s*\)", "@include mobile"
            $changesApplied += "Replaced: @media (max-width: var(--bp-sm)) → @include mobile"
        }

        # @media (max-width: 768px) -> @include tablet
        if ($content -match "@media\s*\(\s*max-width:\s*768px") {
            $content = $content -replace "@media\s*\(\s*max-width:\s*768px\s*\)", "@include tablet"
            $changesApplied += "Replaced: @media (max-width: 768px) → @include tablet"
        }

        # @media (max-width: 480px) -> @include mobile
        if ($content -match "@media\s*\(\s*max-width:\s*480px") {
            $content = $content -replace "@media\s*\(\s*max-width:\s*480px\s*\)", "@include mobile"
            $changesApplied += "Replaced: @media (max-width: 480px) → @include mobile"
        }

        # =============================================
        # 3. Replace hardcoded rgba colors with variables
        # =============================================
        
        # rgba(99, 102, 241, -> rgba(var(--primary-rgb),
        if ($content -match "rgba\(99,\s*102,\s*241,") {
            $content = $content -replace "rgba\(99,\s*102,\s*241,", "rgba(var(--primary-rgb),"
            $changesApplied += "Replaced: rgba(99, 102, 241, → rgba(var(--primary-rgb),"
        }

        # rgba(239, 68, 68, -> rgba(var(--error-rgb),
        if ($content -match "rgba\(239,\s*68,\s*68,") {
            $content = $content -replace "rgba\(239,\s*68,\s*68,", "rgba(var(--error-rgb),"
            $changesApplied += "Replaced: rgba(239, 68, 68, → rgba(var(--error-rgb),"
        }

        # =============================================
        # Write back to file
        # =============================================
        if ($content -ne $originalContent) {
            Set-Content $filePath $content -Encoding UTF8 -NoNewline
        }

        # Report
        Write-Host "✓ Successfully processed: $fileName" -ForegroundColor Green
        
        if ($changesApplied.Count -eq 0) {
            Write-Host "  (No changes applied - file already compliant)" -ForegroundColor Gray
        } else {
            foreach ($change in $changesApplied) {
                Write-Host "  • $change"
            }
        }
        
        if (-not $NoBackup) {
            Write-Host "  Backup: $fileName.backup" -ForegroundColor Gray
        }
        
        Write-Host ""
        $processedCount++
        $replacementSummary[$fileName] = $changesApplied.Count
    }
    catch {
        Write-Host "✗ ERROR processing $fileName : $_" -ForegroundColor Red
        Write-Host ""
        $errorCount++
    }
}

# =============================================
# Summary Report
# =============================================
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "Refactoring Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Files processed successfully: $processedCount" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "Errors encountered: $errorCount" -ForegroundColor Red
} else {
    Write-Host "Errors encountered: 0" -ForegroundColor Green
}

$totalChanges = ($replacementSummary.Values | Measure-Object -Sum).Sum
Write-Host "Total replacements applied: $totalChanges"
Write-Host ""

if ($errorCount -gt 0) {
    exit 1
} else {
    exit 0
}
