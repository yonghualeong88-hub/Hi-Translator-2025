# Cloudflare R2 批量上传脚本
# 前提：已安装 wrangler 并登录 (npm install -g wrangler && wrangler login)

Write-Host "📤 上传Vosk模型到Cloudflare R2" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$modelsDir = "D:\vosk-models"
$bucketName = "vosk-models"

# 检查wrangler是否已安装
try {
    $null = Get-Command wrangler -ErrorAction Stop
} catch {
    Write-Host "❌ 未找到 wrangler 命令" -ForegroundColor Red
    Write-Host "请先安装: npm install -g wrangler" -ForegroundColor Yellow
    Write-Host "然后登录: wrangler login" -ForegroundColor Yellow
    exit 1
}

# 检查目录是否存在
if (!(Test-Path $modelsDir)) {
    Write-Host "❌ 找不到目录: $modelsDir" -ForegroundColor Red
    exit 1
}

# 获取所有zip文件
$files = Get-ChildItem "$modelsDir\*.zip"

if ($files.Count -eq 0) {
    Write-Host "❌ 在 $modelsDir 中没有找到 .zip 文件" -ForegroundColor Red
    exit 1
}

Write-Host "📦 找到 $($files.Count) 个文件，准备上传到 Bucket: $bucketName`n" -ForegroundColor Yellow

$currentFile = 0
$successCount = 0
$failCount = 0

foreach ($file in $files) {
    $currentFile++
    $fileName = $file.Name
    $sizeInMB = [math]::Round($file.Length / 1MB, 2)
    
    Write-Host "[$currentFile/$($files.Count)] " -NoNewline -ForegroundColor Cyan
    Write-Host "⏫ 上传 $fileName ($sizeInMB MB)..." -ForegroundColor White
    
    try {
        # 上传到R2
        $objectPath = "$bucketName/$fileName"
        
        $startTime = Get-Date
        wrangler r2 object put $objectPath --file="$($file.FullName)" 2>&1 | Out-Null
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        Write-Host "    ✅ 上传完成 ($($duration.ToString('F1'))秒)" -ForegroundColor Green
        $successCount++
        
    } catch {
        Write-Host "    ❌ 上传失败: $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📊 上传统计:" -ForegroundColor Cyan
Write-Host "  ✅ 成功: $successCount" -ForegroundColor Green
Write-Host "  ❌ 失败: $failCount" -ForegroundColor Red

if ($successCount -gt 0) {
    Write-Host "`n🎉 上传完成！" -ForegroundColor Green
    Write-Host "`n📝 下一步:" -ForegroundColor Cyan
    Write-Host "  1. 在Cloudflare R2控制台中开启公开访问" -ForegroundColor Yellow
    Write-Host "  2. 获取公开域名URL" -ForegroundColor Yellow
    Write-Host "  3. 更新 config/vosk-models.ts 中的 CUSTOM URL" -ForegroundColor Yellow
}

Write-Host "`n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

