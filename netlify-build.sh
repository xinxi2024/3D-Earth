#!/bin/bash

echo "当前Node.js版本:"
node --version

echo "安装依赖..."
npm ci

echo "构建项目..."
npm run build

echo "构建完成！" 