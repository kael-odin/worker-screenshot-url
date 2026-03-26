# Worker Screenshot URL

CafeScraper 平台 Worker - 对指定网页进行截图。

## 功能特性

- ✅ 支持多 URL 批量截图
- ✅ 多种输出格式：PNG、JPEG、PDF
- ✅ 全页面或视口截图
- ✅ 自定义视口宽度
- ✅ 滚动到页面底部
- ✅ 隐藏指定选择器元素
- ✅ 等待指定选择器出现
- ✅ 广告和追踪器拦截
- ✅ Cafe 平台 SDK 集成

## 文件结构

```
worker-screenshot-url/
├── main.js              # 主程序入口
├── input_schema.json    # 输入参数定义
├── package.json         # 依赖配置
├── sdk_local.js         # 本地测试 Mock SDK
├── comprehensive-test.js # 全量测试脚本
└── README.md            # 本文档
```

## 输入参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `urls` | array | [] | 要截图的 URL 列表 |
| `viewportWidth` | integer | 1280 | 浏览器视口宽度 (100-3840) |
| `format` | string | png | 输出格式：png, jpeg, pdf |
| `fullPage` | boolean | true | 是否截取整个页面 |
| `scrollToBottom` | boolean | false | 是否滚动到页面底部 |
| `delayAfterScrolling` | integer | 0 | 滚动后延迟时间 (ms) |
| `waitUntil` | string | networkidle2 | 页面加载完成条件 |
| `delay` | integer | 0 | 截图前延迟时间 (ms) |
| `timeout` | integer | 60 | 页面超时时间 (秒) |
| `selectorsToHide` | array | [] | 要隐藏的 CSS 选择器 |
| `waitForSelector` | string | "" | 等待出现的选择器 |
| `blockAds` | boolean | true | 是否拦截广告和追踪器 |
| `debugMode` | boolean | false | 是否启用调试日志 |

## 使用方法

### 本地测试

```bash
# 安装依赖
npm install

# 使用 Cafe 平台模拟器测试
cd ../cafe-platform-simulator
node simulator.js worker-screenshot-url test-inputs/real-test-screenshot.json

# 或运行全量测试
cd ../worker-screenshot-url
node comprehensive-test.js
```

### Cafe 平台部署

1. 将整个 `worker-screenshot-url` 目录上传到 Cafe 平台
2. 配置输入参数
3. 运行 Worker

## 输出格式

每条输出记录包含：

```json
{
  "startUrl": "https://example.com",
  "url": "https://example.com/",
  "title": "Example Domain",
  "screenshotName": "screenshot_example_com_xxx",
  "screenshotSize": 14164,
  "format": "png",
  "viewportWidth": 1280,
  "fullPage": true,
  "error": null,
  "loadedAt": "2026-03-26T08:07:55.146Z"
}
```

## 测试报告

运行 `node comprehensive-test.js` 生成测试报告：

- 单元测试：URL 解析、配置验证、名称生成
- 集成测试：浏览器启动、截图功能、视口设置
- Cafe 平台测试：输入格式兼容性
- 端到端测试：完整工作流
- 错误处理测试：异常情况处理

## 与原 Actor 的差异

原项目 `store-screenshot-url` 是 Apify Actor，本项目已改造为 Cafe 平台 Worker：

| 功能 | 原 Actor | 本 Worker |
|------|----------|-----------|
| SDK | Apify SDK | Cafe SDK (gRPC) |
| 浏览器 | 内置/代理 | CDP 远程浏览器 |
| 存储 | KeyValueStore | Cafe 结果推送 |
| 输入解析 | Apify 格式 | Cafe 格式兼容 |

## 版本历史

- v1.0.0 (2026-03-26): 初始版本，从 Apify Actor 改造完成
  - 22/22 测试通过
  - Cafe 平台模拟器测试通过
