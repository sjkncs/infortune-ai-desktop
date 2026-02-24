# GitHub 仓库设置脚本
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  In Fortune AI Desktop - GitHub 设置  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 配置
Write-Host "📋 检查 Git 配置..." -ForegroundColor Yellow
$gitUser = git config user.name
$gitEmail = git config user.email

if (-not $gitUser -or -not $gitEmail) {
    Write-Host "⚠️  请先配置 Git 用户信息：" -ForegroundColor Red
    Write-Host "   git config --global user.name `"Your Name`"" -ForegroundColor Yellow
    Write-Host "   git config --global user.email `"your@email.com`"" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git 用户: $gitUser ($gitEmail)" -ForegroundColor Green
Write-Host ""

# 提示创建仓库
Write-Host "📝 请按以下步骤操作：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  访问: https://github.com/new" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  填写仓库信息：" -ForegroundColor White
Write-Host "   Repository name: InFortune.ai-desktop" -ForegroundColor Cyan
Write-Host "   Description: Professional AI-powered stock analysis system with Desktop App | In Fortune AI" -ForegroundColor Cyan
Write-Host "   Visibility: Public" -ForegroundColor Cyan
Write-Host "   ❌ 不要勾选 'Add a README file'" -ForegroundColor Red
Write-Host ""
Write-Host "3️⃣  点击 'Create repository'" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "是否已在 GitHub 创建好仓库？(y/n)"

if ($confirm -ne "y") {
    Write-Host "❌ 请先创建 GitHub 仓库后再运行此脚本" -ForegroundColor Red
    exit 0
}

# 获取 GitHub 用户名
Write-Host ""
$githubUser = Read-Host "请输入你的 GitHub 用户名（默认: sjkncs）"
if (-not $githubUser) {
    $githubUser = "sjkncs"
}

# 添加远程仓库
Write-Host ""
Write-Host "📡 添加远程仓库..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/$githubUser/InFortune.ai-desktop.git"

$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "⚠️  远程仓库已存在，更新URL..." -ForegroundColor Yellow
    git remote set-url origin $remoteUrl
} else {
    git remote add origin $remoteUrl
}

Write-Host "✅ 远程仓库: $remoteUrl" -ForegroundColor Green

# 设置主分支
Write-Host ""
Write-Host "🌿 设置主分支..." -ForegroundColor Yellow
git branch -M main
Write-Host "✅ 主分支已设置为 main" -ForegroundColor Green

# 推送到 GitHub
Write-Host ""
Write-Host "🚀 推送代码到 GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  如果是首次推送，可能需要输入 GitHub 凭据" -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Green
    Write-Host "  ✅ 推送成功！  " -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🏷️  下一步 - 添加 Topics：" -ForegroundColor Yellow
    Write-Host "   访问: https://github.com/$githubUser/InFortune.ai-desktop" -ForegroundColor Cyan
    Write-Host "   点击右侧 ⚙️ → 添加以下 topics：" -ForegroundColor White
    Write-Host ""
    Write-Host "   stock-analysis, ai, electron, vue, typescript," -ForegroundColor Cyan
    Write-Host "   python, fastapi, desktop-app, fintech," -ForegroundColor Cyan
    Write-Host "   machine-learning, data-visualization, stock-market" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📝 创建 Release：" -ForegroundColor Yellow
    Write-Host "   https://github.com/$githubUser/InFortune.ai-desktop/releases/new" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🎉 完成！" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ 推送失败！" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 可能的原因：" -ForegroundColor Yellow
    Write-Host "   1. GitHub 凭据未配置或无效" -ForegroundColor White
    Write-Host "   2. 仓库未创建或名称错误" -ForegroundColor White
    Write-Host "   3. 网络连接问题" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 解决方案：" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "方案1 - 使用 Personal Access Token：" -ForegroundColor White
    Write-Host "   1. 访问: https://github.com/settings/tokens/new" -ForegroundColor Cyan
    Write-Host "   2. 生成 token（勾选 repo 权限）" -ForegroundColor Cyan
    Write-Host "   3. 重新推送并使用 token 作为密码" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "方案2 - 使用 SSH：" -ForegroundColor White
    Write-Host "   git remote set-url origin git@github.com:$githubUser/InFortune.ai-desktop.git" -ForegroundColor Cyan
    Write-Host "   git push -u origin main" -ForegroundColor Cyan
}
