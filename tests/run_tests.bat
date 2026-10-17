@echo off
REM Runs all MovieMind tests. Double-click this file, or run it from a terminal.
cd /d "%~dp0"
python run_tests.py %*
pause
