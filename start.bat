@echo off
echo Starting SmartDocQ Application...
echo.

echo Starting Backend Server...
cd backend
start "SmartDocQ Backend" cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Starting Frontend Server...
cd ../frontend
start "SmartDocQ Frontend" cmd /k "npm start"

echo.
echo SmartDocQ is starting up!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this launcher...
pause > nul 