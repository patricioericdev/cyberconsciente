@echo off
echo.
echo  ==========================================
echo   CYBERCONSCIENTE - Iniciando Sistema
echo  ==========================================
echo.

echo [1/2] Iniciando Backend (FastAPI)...
start "CyberConsciente Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Frontend (React)...
start "CyberConsciente Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo  ==========================================
echo   Sistema iniciado!
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo  ==========================================
echo.
echo  Pressione qualquer tecla para fechar esta janela...
pause > nul
