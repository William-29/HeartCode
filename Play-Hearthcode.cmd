@echo off
cd /d "%~dp0"
title Hearthcode - The Learning Tavern
echo.
echo  Welcome to Hearthcode.
echo  The tavern will open in your default browser.
echo  Keep this window open while you play.
echo.
node server.mjs --open
if errorlevel 1 pause
