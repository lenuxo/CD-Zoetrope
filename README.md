# CD Zoetrope

把走马灯动画印在音频 CD 的盘面上。CD 播放器正常播放音乐，外置光学传感器读取盘面的黑白标记，再触发 LED 短闪。每次闪光时，固定观察位置会看到下一帧，连起来就是循环动画。

当前仓库包含测试盘样例和浏览器编辑器。硬件原型的验收目标是在播放器闭盖、正常播放时，能辨认出盘面上的循环动作。实际读标和照明效果还需要用印刷样片验证。

## 盘面编辑器

编辑器支持小球跳动和游鱼摆尾，可调整帧数、重复次数、盘片转向和印刷范围。可以预览盘面、旋转和频闪采样，并导出 120 × 120 mm 的 SVG 或 600 DPI 的 PNG。编辑和导出都在浏览器中完成。

本地启动需要 Node.js 20.19+（20.x）或 22.12+。

```sh
cd disc-editor
npm ci
npm run dev
```

生产构建运行 `npm run build`，会先执行 TypeScript 类型检查。[编辑器开发说明](disc-editor/README.md)记录了预览模型和源码结构。

## 测试盘样例

样例集中在 [examples/discs](examples/discs/)。槽数是每圈的同步位置数，帧数是一个动作循环的帧数。

| 样例 | 同步位置与动作 |
| --- | --- |
| [小球跳动](examples/discs/cd-ball-12slots-12f.svg) | 12 槽、12 帧，每圈一轮 |
| [游鱼摆尾](examples/discs/cd-koi-12slots-12f.svg) | 12 槽、12 帧，每圈一轮 |
| [游鱼摆尾 · 三轮](examples/discs/cd-koi-54slots-18f.svg) | 54 槽、18 帧，每圈三轮 |
| [早期 12 帧测试盘](examples/discs/cd-zoetrope-12f.svg) | 12 帧排版样例 |

第一次做硬件验证可以从小球跳动开始。频闪对准后，观察固定位置的小球能不能相对基准线反复跳动。正式印刷前，按商家模板和播放器闭盖后的可见范围核对盘面尺寸与同步环位置。

## GitHub Pages

仓库的 [Pages 工作流](.github/workflows/pages.yml)从 `main` 手动运行，构建并发布 `disc-editor/dist/`。
