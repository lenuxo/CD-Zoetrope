# CD Zoetrope 测试盘编辑器

本地编辑和预览游鱼摆尾、小球跳动两种测试盘。用 Vite 构建，React + TypeScript 管理编辑与播放状态，Tailwind CSS 提供界面样式。

使用 Node.js 20.19+（20.x）或 22.12+。

```sh
npm ci
npm run dev
```

浏览器打开终端显示的地址。默认测试盘为 12 帧、一圈一组。可调整帧数、重复次数、盘片转向、图案和印刷范围。右上角可导出 120 × 120 mm 的 SVG，或 2835 × 2835 像素、600 DPI 的 PNG。两种格式都导出完整盘面，中心和外缘保持透明。

```sh
npm run typecheck
npm run build
npm run preview
```

构建会先执行严格的 TypeScript 类型检查。生产文件位于 `dist/`，可用静态文件服务器提供。编辑和导出都在浏览器中完成。

预览工作区顶部可切换「盘面图案」和「动作预览」。选中「动作预览」后可选择「旋转」「定格帧」或「频闪」。

- 旋转按 [IEC 60908](https://audio-union.com/wp-content/uploads/2023/02/Red-Book-Audio-Recording-Compact-Disc-Digital-Audio-System-IEC-60908-Second-Edition-1999-02-ISBN-2-8318-4638-2.pdf) 的读盘参数建立典型 1× 音频 CD 模型。预览以 1.3 m/s 扫描，读盘半径从 25 mm 移到 58 mm 时约从 497 RPM 降到 214 RPM。
- 频闪按每个同步槽触发一次计算频率与脉宽内的拖影。屏幕按每秒两次逐次慢放。启用系统「减少动态效果」时，频闪预览保持亮度恒定。

- `src/App.tsx` — 盘面设置与导出操作
- `src/Preview.tsx` — 预览模式与播放控制
- `src/simulation.ts` — 恒线速旋转与频闪计算
- `src/settings.ts` — 参数范围和默认值
- `src/disc.ts` — 盘面几何、动画帧和 SVG 生成
- `src/export.ts` — PNG 编码、印刷分辨率和文件下载
- `src/styles.css` — Tailwind 入口和界面主题
