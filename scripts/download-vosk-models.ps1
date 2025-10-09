# Vosk模型批量下载脚本
# 用法: powershell -ExecutionPolicy Bypass -File scripts\download-vosk-models.ps1

Write-Host "🎤 Vosk模型批量下载工具" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# 创建下载目录
$downloadDir = "D:\vosk-models"
if (!(Test-Path $downloadDir)) {
    New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null
    Write-Host "📁 创建下载目录: $downloadDir`n" -ForegroundColor Green
}

# 定义要下载的模型
$models = @(
    @{Name="vosk-model-small-en-us-0.15"; Size="40MB"; Language="英语"},
    @{Name="vosk-model-small-cn-0.22"; Size="42MB"; Language="中文"},
    @{Name="vosk-model-small-ja-0.22"; Size="48MB"; Language="日语"},
    @{Name="vosk-model-small-ko-0.22"; Size="82MB"; Language="韩语"},
    @{Name="vosk-model-small-fr-0.22"; Size="41MB"; Language="法语"},
    @{Name="vosk-model-small-de-0.15"; Size="45MB"; Language="德语"},
    @{Name="vosk-model-small-es-0.42"; Size="39MB"; Language="西班牙语"},
    @{Name="vosk-model-small-it-0.22"; Size="48MB"; Language="意大利语"},
    @{Name="vosk-model-small-pt-0.3"; Size="31MB"; Language="葡萄牙语"},
    @{Name="vosk-model-small-ru-0.22"; Size="45MB"; Language="俄语"},
    @{Name="vosk-model-small-hi-0.22"; Size="42MB"; Language="印地语"}
)

Write-Host "📋 将下载 $($models.Count) 个模型，总大小约 500MB`n" -ForegroundColor Yellow

$totalModels = $models.Count
$currentModel = 0
$successCount = 0
$failCount = 0

foreach ($model in $models) {
    $currentModel++
    $modelName = $model.Name
    $language = $model.Language
    $size = $model.Size
    $url = "https://alphacephei.com/vosk/models/$modelName.zip"
    $output = Join-Path $downloadDir "$modelName.zip"
    
    Write-Host "[$currentModel/$totalModels] " -NoNewline -ForegroundColor Cyan
    Write-Host "⏬ 下载 $language 模型 ($modelName, $size)..." -ForegroundColor White
    
    # 检查文件是否已存在
    if (Test-Path $output) {
        $fileSize = (Get-Item $output).Length
        if ($fileSize -gt 1MB) {
            Write-Host "    ✓ 文件已存在，跳过下载" -ForegroundColor Gray
            $successCount++
            continue
        }
    }
    
    try {
        # 使用Invoke-WebRequest下载，显示进度
        $ProgressPreference = 'SilentlyContinue'  # 禁用默认进度条（更快）
        
        $startTime = Get-Date
        Invoke-WebRequest -Uri $url -OutFile $output -TimeoutSec 600 -ErrorAction Stop
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        $fileSize = (Get-Item $output).Length / 1MB
        $speed = $fileSize / $duration
        
        Write-Host "    ✅ 下载完成 ($($fileSize.ToString('F2')) MB, $($duration.ToString('F1'))秒, $($speed.ToString('F2')) MB/s)" -ForegroundColor Green
        $successCount++
        
    } catch {
        Write-Host "    ❌ 下载失败: $_" -ForegroundColor Red
        $failCount++
        
        # 删除不完整的文件
        if (Test-Path $output) {
            Remove-Item $output -Force
        }
    }
    
    # 避免请求过快
    Start-Sleep -Milliseconds 500
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📊 下载统计:" -ForegroundColor Cyan
Write-Host "  ✅ 成功: $successCount" -ForegroundColor Green
Write-Host "  ❌ 失败: $failCount" -ForegroundColor Red
Write-Host "  📁 保存位置: $downloadDir" -ForegroundColor Yellow

if ($successCount -gt 0) {
    Write-Host "`n📦 已下载的文件:" -ForegroundColor Cyan
    Get-ChildItem $downloadDir\*.zip | ForEach-Object {
        $sizeInMB = $_.Length / 1MB
        Write-Host "  - $($_.Name) ($($sizeInMB.ToString('F2')) MB)" -ForegroundColor Gray
    }
    
    $totalSize = (Get-ChildItem $downloadDir\*.zip | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "`n  总计: $($totalSize.ToString('F2')) MB" -ForegroundColor Yellow
}

if ($failCount -gt 0) {
    Write-Host "`n⚠️  部分模型下载失败，请检查网络连接后重新运行此脚本" -ForegroundColor Yellow
    Write-Host "   已下载的文件会自动跳过" -ForegroundColor Gray
} else {
    Write-Host "`n🎉 所有模型下载完成！" -ForegroundColor Green
    Write-Host "`n📤 下一步: 将这些文件上传到云存储服务" -ForegroundColor Cyan
    Write-Host "   阿里云OSS: https://oss.console.aliyun.com/" -ForegroundColor Gray
    Write-Host "   七牛云: https://portal.qiniu.com/" -ForegroundColor Gray
    Write-Host "   Cloudflare R2: https://dash.cloudflare.com/" -ForegroundColor Gray
}

Write-Host "`n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

