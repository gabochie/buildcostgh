@echo off
REM Weekly BuildCost GH database backup. Registered via:
REM   schtasks /create /tn "BuildCostGH weekly backup" /tr "C:\Users\user\Documents\GitHub\buildcostgh\scripts\backup-weekly.cmd" /sc weekly /d SUN /st 02:00
cd /d "%~dp0.."
"C:\nvm4w\nodejs\node.exe" --env-file=.env.local scripts\backup-db.mjs --dir backups
