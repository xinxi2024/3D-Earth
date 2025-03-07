#!/bin/bash

# 清理旧文件
rm -rf .next out node_modules package-lock.json

# 安装依赖 - 使用纯净安装模式
export NODE_OPTIONS="--max-old-space-size=3072"
npm ci --prefer-offline --no-audit --no-fund --loglevel=error

# 构建项目
npm run build

echo "构建完成！" 