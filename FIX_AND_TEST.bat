@echo off
echo ==========================================
echo ZAI-CTS Fix and Test Script
echo ==========================================

:: Fix Frontend Dependencies
echo Installing frontend dependencies...
cd /d "C:\Users\User\Desktop\luxestate\frontend\web-portal"
call npm install axios framer-motion @mui/icons-material

echo.
echo ==========================================
echo Testing Backend Services
echo ==========================================

:: Test Health Endpoints
echo Testing Carbon Registry (8102)...
curl -s http://127.0.0.1:8102/health

echo.
echo Testing AI Validation (8103)...
curl -s http://127.0.0.1:8103/health

echo.
echo Testing Marketplace (8106)...
curl -s http://127.0.0.1:8106/health

echo.
echo Testing Compliance (8107)...
curl -s http://127.0.0.1:8107/health

echo.
echo ==========================================
echo Testing Marketplace API
echo ==========================================

echo Getting listings...
curl -s http://127.0.0.1:8106/api/v1/marketplace/listings

echo.
echo Testing trade execution...
curl -s -X POST http://127.0.0.1:8106/api/v1/marketplace/trades -H "Content-Type: application/json" -d "{\"listing_id\":\"0cb766ff-7743-4c7c-8d6a-1d63ab070633\",\"buyer_id\":\"buyer-001\",\"quantity_tco2e\":1000,\"price_per_tco2e\":32.5,\"payment_method\":\"bank_transfer\"}"

echo.
echo ==========================================
echo Done!
echo ==========================================
pause
