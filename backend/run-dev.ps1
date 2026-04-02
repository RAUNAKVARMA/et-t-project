# Cosmic RAG API — run from this folder:  .\run-dev.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".venv\Scripts\python.exe")) {
  Write-Host "Creating .venv and installing dependencies (first run may take a minute)..."
  python -m venv .venv
  & .\.venv\Scripts\python.exe -m pip install -U pip
  & .\.venv\Scripts\pip.exe install -r requirements.txt
}

Write-Host "Starting API at http://127.0.0.1:8000  (health: /health)"
& .\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
