@echo off
:loop
echo [%time%] Dang kiem tra thay doi...
git add .
git commit -m "Auto update: %date% %time%" >nul 2>&1
if %errorlevel% equ 0 (
    echo [%time%] Tim thay thay doi! Dang day len GitHub...
    git push origin main
    echo [%time%] Da cap nhat thanh cong.
)
timeout /t 30 >nul
goto loop
