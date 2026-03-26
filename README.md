# 📸 网页截图工具 | Website Screenshot Tool

[English](#english) | [中文](#中文)

---

<a name="中文"></a>
## 中文

### 🎯 功能简介

网页截图工具可以帮助您快速、高效地对任意网页进行截图。支持批量截图、多种输出格式、全页面截图等功能，适用于网站监控、内容存档、设计参考等多种场景。

### ✨ 核心特性

| 功能 | 说明 |
|------|------|
| 🖼️ 多格式输出 | 支持 PNG、JPEG、PDF 三种格式 |
| 📄 全页面截图 | 一键截取整个页面，不受屏幕限制 |
| 🎛️ 视口自定义 | 支持 100-3840px 宽度设置 |
| 🔄 批量处理 | 一次运行，多个网页同时截图 |
| ⏱️ 灵活等待 | 支持页面加载完成后再截图 |
| 🎭 元素隐藏 | 可隐藏广告、弹窗等干扰元素 |
| 🛡️ 广告拦截 | 自动拦截广告和追踪脚本 |

### 📋 输入参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `urls` | 列表 | 必填 | 要截图的网页地址列表 |
| `viewportWidth` | 数字 | 1280 | 浏览器宽度（100-3840像素） |
| `format` | 选项 | png | 输出格式：png / jpeg / pdf |
| `fullPage` | 开关 | 是 | 是否截取整个页面 |
| `scrollToBottom` | 开关 | 否 | 是否滚动到页面底部 |
| `delay` | 数字 | 0 | 截图前等待时间（毫秒） |
| `timeout` | 数字 | 60 | 页面加载超时时间（秒） |
| `selectorsToHide` | 列表 | 空 | 要隐藏的元素选择器 |
| `blockAds` | 开关 | 是 | 是否拦截广告 |

### 📤 输出示例

```json
{
  "startUrl": "https://example.com",
  "url": "https://example.com/",
  "title": "Example Domain",
  "screenshotName": "screenshot_example_com_xxx",
  "screenshotSize": 14164,
  "format": "png",
  "fullPage": true,
  "error": null
}
```

### 🔧 使用场景

- **📊 竞品分析**：定期截取竞品网站页面，追踪设计变化
- **📝 内容存档**：保存网页内容，防止链接失效
- **🎨 设计参考**：收集优秀网页设计作为灵感来源
- **📈 监控告警**：监控网站状态，及时发现异常
- **📋 报告生成**：生成可视化报告和演示文档

### ❓ 常见问题

**Q: 支持哪些网页格式？**  
A: 支持所有公开可访问的 HTTP/HTTPS 网页。

**Q: 截图质量如何？**  
A: 支持高清截图，PNG 格式无损，JPEG 可调节压缩质量。

**Q: 动态内容能截到吗？**  
A: 可以。工具会等待页面完全加载后再截图，支持 JavaScript 渲染的内容。

**Q: 有数量限制吗？**  
A: 单次运行支持多个 URL，具体限制取决于平台配置。

---

<a name="english"></a>
## English

### 🎯 Overview

Website Screenshot Tool helps you quickly and efficiently capture screenshots of any webpage. With support for batch processing, multiple output formats, and full-page capture, it's perfect for website monitoring, content archiving, design reference, and more.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🖼️ Multiple Formats | PNG, JPEG, PDF output supported |
| 📄 Full Page Capture | Capture entire pages beyond viewport |
| 🎛️ Custom Viewport | 100-3840px width settings |
| 🔄 Batch Processing | Multiple URLs in one run |
| ⏱️ Flexible Timing | Wait for page load before capture |
| 🎭 Element Hiding | Hide ads, popups, and distractions |
| 🛡️ Ad Blocking | Auto-block ads and tracking scripts |

### 📋 Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `urls` | List | Required | List of webpage URLs to capture |
| `viewportWidth` | Number | 1280 | Browser width (100-3840 pixels) |
| `format` | Select | png | Output format: png / jpeg / pdf |
| `fullPage` | Switch | Yes | Capture entire page or viewport only |
| `scrollToBottom` | Switch | No | Scroll to page bottom before capture |
| `delay` | Number | 0 | Wait time before screenshot (ms) |
| `timeout` | Number | 60 | Page load timeout (seconds) |
| `selectorsToHide` | List | Empty | CSS selectors to hide |
| `blockAds` | Switch | Yes | Block ads and trackers |

### 📤 Output Example

```json
{
  "startUrl": "https://example.com",
  "url": "https://example.com/",
  "title": "Example Domain",
  "screenshotName": "screenshot_example_com_xxx",
  "screenshotSize": 14164,
  "format": "png",
  "fullPage": true,
  "error": null
}
```

### 🔧 Use Cases

- **📊 Competitor Analysis**: Track competitor website changes over time
- **📝 Content Archiving**: Save web content before links expire
- **🎨 Design Reference**: Collect inspiring web designs
- **📈 Monitoring**: Monitor website status and detect issues
- **📋 Reporting**: Generate visual reports and presentations

### ❓ FAQ

**Q: What webpages are supported?**  
A: All publicly accessible HTTP/HTTPS webpages are supported.

**Q: What's the screenshot quality?**  
A: High-quality capture with lossless PNG and adjustable JPEG compression.

**Q: Can it capture dynamic content?**  
A: Yes. The tool waits for full page load, including JavaScript-rendered content.

**Q: Is there a limit on URLs?**  
A: Multiple URLs per run are supported, subject to platform configuration.

---

### 📊 技术规格 | Technical Specs

- **运行环境**: Node.js + Puppeteer
- **浏览器引擎**: Chromium
- **并发支持**: 多页面并行处理
- **代理支持**: 支持平台代理池

---

### 📝 更新日志 | Changelog

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0.0 | 2026-03-26 | 初始版本发布 |

---

<p align="center">
  <b>网页截图工具 | Website Screenshot Tool</b><br>
  <sub>高效、灵活、专业的网页截图解决方案</sub>
</p>
