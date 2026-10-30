# Launches THE OCCULT ARCHIVE in the default web browser
Write-Host "=======================================================" -ForegroundColor DarkRed
Write-Host "  THE OCCULT ARCHIVE - HAUNTED OBJECT REGISTRY" -ForegroundColor Red
Write-Host "  Site-19 Security Surveillance Platform Initializing..." -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor DarkRed
Write-Host "Launching Site-19 Archive in your default browser..." -ForegroundColor Cyan

$indexPath = Join-Path $PSScriptRoot "index.html"
Start-Process $indexPath
