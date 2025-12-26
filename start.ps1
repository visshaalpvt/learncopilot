# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Green
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "Starting Frontend Server..." -ForegroundColor Green
Set-Location ../frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "`nServers starting..." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
