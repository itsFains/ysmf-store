@echo off
setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0" >nul 2>&1

REM ============================================================
REM YSMF WEBSITE BACKUP V3
REM Standalone BAT - no separate PowerShell script required.
REM Put this file directly beside index.html.
REM ============================================================

if not exist "index.html" (
    echo.
    echo ============================================================
    echo   YSMF BACKUP STOPPED
    echo ============================================================
    echo.
    echo index.html was not found beside this BAT file.
    echo Put BACKUP_YSMF_SITE_V3.bat in the live ysmf-store root.
    echo.
    pause
    popd
    exit /b 1
)

if not exist "assets\" (
    echo.
    echo ERROR: assets folder was not found beside this BAT file.
    echo.
    pause
    popd
    exit /b 2
)

set "ROOT=%CD%"
set "STAMP="

REM Use PowerShell only to obtain a clean timestamp. The backup itself uses Robocopy.
for /f "usebackq delims=" %%I in (`powershell.exe -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss" 2^>nul`) do set "STAMP=%%I"

REM Fallback if PowerShell is unavailable.
if not defined STAMP (
    set "STAMP=%DATE%_%TIME%"
    set "STAMP=!STAMP:/=-!"
    set "STAMP=!STAMP:\=-!"
    set "STAMP=!STAMP::=-!"
    set "STAMP=!STAMP:.=-!"
    set "STAMP=!STAMP:,=!"
    set "STAMP=!STAMP: =0!"
)

if not exist "BACKUPS\" mkdir "BACKUPS" >nul 2>&1

set "DEST=%ROOT%\BACKUPS\!STAMP!"
if exist "!DEST!\" set "DEST=%ROOT%\BACKUPS\!STAMP!_!RANDOM!"

mkdir "!DEST!" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Could not create the backup folder:
    echo !DEST!
    echo.
    pause
    popd
    exit /b 3
)

echo.
echo ============================================================
echo   YSMF WEBSITE BACKUP V3
echo ============================================================
echo.
echo Source:
echo %ROOT%
echo.
echo Destination:
echo !DEST!
echo.
echo Copying files...
echo.

REM Robocopy exit codes 0-7 are success / non-fatal. 8+ means failure.
robocopy "%ROOT%" "!DEST!" /E /COPY:DAT /DCOPY:DAT /R:2 /W:1 /XJ /NP /XD "%ROOT%\BACKUPS" "%ROOT%\.git"

set "RC=!ERRORLEVEL!"

if !RC! GEQ 8 (
    echo.
    echo ============================================================
    echo   BACKUP FAILED - ROBOCOPY ERROR !RC!
    echo ============================================================
    echo.
    echo No live files were changed.
    echo Check the Robocopy messages above.
    echo.
    pause
    popd
    exit /b !RC!
)

for /f %%C in ('dir /s /b /a-d "!DEST!" ^| find /c /v ""') do set "FILECOUNT=%%C"

> "!DEST!\_BACKUP_MANIFEST.txt" (
    echo YSMF WEBSITE BACKUP V3
    echo Created: !STAMP!
    echo Source: %ROOT%
    echo Destination: !DEST!
    echo Files copied before manifest: !FILECOUNT!
    echo Robocopy result code: !RC!
    echo.
    echo Excluded:
    echo - BACKUPS
    echo - .git
    echo.
    echo Files:
)

for /r "!DEST!" %%F in (*) do (
    echo %%~fF>> "!DEST!\_BACKUP_MANIFEST.txt"
)

echo.
echo ============================================================
echo   BACKUP FINISHED SUCCESSFULLY
echo ============================================================
echo.
echo Files copied: !FILECOUNT!
echo Backup folder:
echo !DEST!
echo.
echo A _BACKUP_MANIFEST.txt file was created inside the backup.
echo.
pause
popd
exit /b 0
