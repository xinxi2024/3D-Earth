# 3D地球模型交互项目

这是一个基于Next.js、React Three Fiber和Three.js的3D地球模型交互项目，允许用户自定义地球颜色和旋转速度。

## 功能特点

- 可交互的3D地球模型
- 自定义地球颜色（预设颜色和自定义颜色选择器）
- 调整旋转速度
- 开启/关闭自动旋转
- 支持鼠标拖拽旋转和滚轮缩放
- 美观的星空背景

## 技术栈

- Next.js 15.1.0
- React 19
- Three.js
- React Three Fiber
- React Three Drei
- Tailwind CSS
- Radix UI组件库
- TypeScript

### 安装步骤

1. 克隆或下载项目代码
2. 解决依赖冲突（使用上述方法之一）
3. 安装依赖

```bash
npm install
```

4. 启动开发服务器

```bash
npm run dev
```

5. 在浏览器中访问 `http://localhost:3000`

## 使用说明

### 地球颜色

- 点击预设颜色按钮可快速更改地球颜色
- 使用颜色选择器可选择自定义颜色

### 旋转控制

- 使用滑块调整自动旋转速度
- 点击"Auto-Rotation"按钮开启或关闭自动旋转
- 用鼠标拖拽可手动旋转地球
- 使用鼠标滚轮可放大或缩小视图

## 项目结构

- `/app` - Next.js应用页面
- `/components` - UI组件
- `/public` - 静态资源
- `earth-scene.tsx` - 3D地球场景组件

## 开发说明

### 自定义地球纹理

如需更换地球纹理，请替换 `/public/assets/3d/texture_earth.jpg` 文件。

### 添加新功能

项目使用了模块化的组件结构，可以轻松扩展新功能：

- 在 `earth-scene.tsx` 中修改3D场景
- 在 `app/page.tsx` 中添加新的UI控制元素

## 构建生产版本

```bash
npm run build
npm start
```

## 许可证

MIT License

Copyright (c) 2025 YuSloane

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.