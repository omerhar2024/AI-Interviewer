# Web Development Environment Checker

Write-Host "Checking web development environment..." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Frontend tools
$frontendTools = @{
    "Node.js" = { node --version }
    "npm" = { npm --version }
    "Yarn" = { yarn --version }
    "Angular CLI" = { ng version }
    "React (Create React App)" = { npx create-react-app --version }
    "Vue CLI" = { vue --version }
}

# Backend tools
$backendTools = @{
    "Python" = { python --version }
    "pip" = { pip --version }
    "PHP" = { php --version }
    "Composer" = { composer --version }
    ".NET Core" = { dotnet --version }
    "Java" = { java -version }
    "Maven" = { mvn --version }
    "Ruby" = { ruby --version }
    "Rails" = { rails --version }
}

# Database tools
$databaseTools = @{
    "MySQL Client" = { mysql --version }
    "PostgreSQL Client" = { psql --version }
    "MongoDB Client" = { mongo --version }
    "SQLite" = { sqlite3 --version }
}

# Development tools
$devTools = @{
    "Git" = { git --version }
    "Docker" = { docker --version }
    "Docker Compose" = { docker-compose --version }
    "Visual Studio Code" = { code --version }
}

# Check function
function Check-Tools($toolsGroup, $groupName) {
    Write-Host "`n$groupName" -ForegroundColor Green
    Write-Host "------------------------" -ForegroundColor Green
    
    foreach ($tool in $toolsGroup.GetEnumerator()) {
        Write-Host "Checking $($tool.Key)... " -NoNewline
        try {
            $version = Invoke-Command -ScriptBlock $tool.Value -ErrorAction SilentlyContinue 2>&1
            if ($version -and -not $version.ToString().Contains("not recognized")) {
                Write-Host "INSTALLED" -ForegroundColor Green
                Write-Host "  Version: $($version -join " ")" -ForegroundColor Gray
            } else {
                Write-Host "NOT INSTALLED" -ForegroundColor Red
            }
        } catch {
            Write-Host "NOT INSTALLED" -ForegroundColor Red
        }
    }
}

# Check for package.json to detect npm dependencies
function Check-NPM-Dependencies {
    Write-Host "`nNPM Project Dependencies" -ForegroundColor Green
    Write-Host "------------------------" -ForegroundColor Green
    
    if (Test-Path "package.json") {
        Write-Host "package.json found. Checking dependencies..." -ForegroundColor Yellow
        
        try {
            $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
            
            Write-Host "`nDependencies:" -ForegroundColor Yellow
            if ($packageJson.dependencies.PSObject.Properties.Count -gt 0) {
                foreach ($dep in $packageJson.dependencies.PSObject.Properties) {
                    Write-Host "  $($dep.Name): $($dep.Value)" -ForegroundColor Gray
                }
            } else {
                Write-Host "  No dependencies found" -ForegroundColor Gray
            }
            
            Write-Host "`nDev Dependencies:" -ForegroundColor Yellow
            if ($packageJson.devDependencies.PSObject.Properties.Count -gt 0) {
                foreach ($dep in $packageJson.devDependencies.PSObject.Properties) {
                    Write-Host "  $($dep.Name): $($dep.Value)" -ForegroundColor Gray
                }
            } else {
                Write-Host "  No dev dependencies found" -ForegroundColor Gray
            }
            
            # Check if dependencies are installed
            Write-Host "`nChecking if node_modules exists..." -NoNewline
            if (Test-Path "node_modules") {
                Write-Host "FOUND" -ForegroundColor Green
            } else {
                Write-Host "NOT FOUND" -ForegroundColor Red
                Write-Host "  Run 'npm install' to install dependencies" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "Error parsing package.json: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "No package.json found in current directory" -ForegroundColor Yellow
    }
}

# Run checks
Check-Tools $frontendTools "Frontend Tools"
Check-Tools $backendTools "Backend Tools"
Check-Tools $databaseTools "Database Tools"
Check-Tools $devTools "Development Tools"
Check-NPM-Dependencies

Write-Host "`nEnvironment check complete!" -ForegroundColor Cyan 