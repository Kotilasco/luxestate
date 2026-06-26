@echo off
echo ==========================================
echo ZAI-CTS System Startup
echo ==========================================

:: Start Backend Services
echo Starting Carbon Registry Service (Port 8102)...
cd /d "C:\Users\User\Desktop\luxestate\backend\services\carbon-registry-service"
start "Carbon Registry" cmd /k ".venv\Scripts\uvicorn.exe app.main:app --port 8102 --reload"

echo Starting AI Validation Service (Port 8103)...
cd /d "C:\Users\User\Desktop\luxestate\backend\services\ai-validation-service"
start "AI Validation" cmd /k ".venv\Scripts\uvicorn.exe app.main:app --port 8103 --reload"

echo Starting Marketplace Service (Port 8106)...
cd /d "C:\Users\User\Desktop\luxestate\backend\services\marketplace-service"
start "Marketplace" cmd /k ".venv\Scripts\uvicorn.exe app.main:app --port 8106 --reload"

echo Starting Compliance Service (Port 8107)...
cd /d "C:\Users\User\Desktop\luxestate\backend\services\compliance-service"
start "Compliance" cmd /k ".venv\Scripts\uvicorn.exe app.main:app --port 8107 --reload"

echo Starting GIS Service (Port 8104)...
cd /d "C:\Users\User\Desktop\luxestate\backend\services\gis-service"
start "GIS Service" cmd /k "python -m uvicorn app.main:app --port 8104 --reload"

:: Start Frontend
echo Starting Frontend (Port 3000)...
cd /d "C:\Users\User\Desktop\luxestate\frontend\web-portal"
start "Frontend" cmd /k "npm run dev"

echo ==========================================
echo All services starting...
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8102/docs
echo ==========================================
pause
