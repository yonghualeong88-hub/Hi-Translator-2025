# 验证R2文件是否都已上传

$r2Domain = "https://pub-9e483ce65c434ee09c5b9905e430627b.r2.dev"

$models = @(
    "vosk-model-small-en-us-0.15.zip",
    "vosk-model-small-cn-0.22.zip",
    "vosk-model-small-ja-0.22.zip",
    "vosk-model-small-ko-0.22.zip",
    "vosk-model-small-fr-0.22.zip",
    "vosk-model-small-de-0.15.zip",
    "vosk-model-small-es-0.42.zip",
    "vosk-model-small-it-0.22.zip",
    "vosk-model-small-pt-0.3.zip",
    "vosk-model-small-ru-0.22.zip",
    "vosk-model-small-hi-0.22.zip"
)

Write-Host "🔍 验证R2文件可访问性" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

$successCount = 0
$failCount = 0

foreach ($model in $models) {
    $url = "$r2Domain/$model"
    Write-Host "检查: $model ... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $size = [math]::Round($response.Headers.'Content-Length' / 1MB, 2)
            Write-Host "✅ 可访问 ($size MB)" -ForegroundColor Green
            $successCount++
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "❌ 404 - 文件不存在" -ForegroundColor Red
        } else {
            Write-Host "❌ 错误: $($_.Exception.Message)" -ForegroundColor Red
        }
        $failCount++
    }
}

Write-Host "`n========================" -ForegroundColor Cyan
Write-Host "✅ 可访问: $successCount" -ForegroundColor Green
Write-Host "❌ 失败: $failCount" -ForegroundColor Red

if ($failCount -gt 0) {
    Write-Host "`n💡 建议:" -ForegroundColor Yellow
    Write-Host "  1. 检查R2 Bucket中的文件列表" -ForegroundColor Gray
    Write-Host "  2. 重新上传缺失的文件" -ForegroundColor Gray
    Write-Host "  3. 确认公开访问已开启" -ForegroundColor Gray
}

Write-Host "`n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


