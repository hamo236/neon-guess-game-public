@echo off
setlocal
cd /d "H:\تجربة احتياطي بكاسة - Copy\بكاسة - Copy\stitch_neon_guess_master"
echo PROJECT=%CD%
if not exist package.json echo ERROR: package.json missing
if not exist vite.config.js echo ERROR: vite.config.js missing
if not exist src\main.jsx echo ERROR: src\main.jsx missing
if exist dev-start.log del /q dev-start.log
npm run dev -- --host 0.0.0.0 > dev-start.log 2>&1
