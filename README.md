# us-vue

这是一个 vue 项目

## 响应式布局

项目采用响应式设计,针对不同设备屏幕尺寸进行了适配优化:

### 断点设置

- **手机端**: `max-width: 767px`
- **平板端**: `768px - 1023px`
- **大屏幕电脑**: `1024px - 1439px`
- **超大屏幕**: `min-width: 1440px`

### 实现代码

```css
/* 手机端 */
@media (max-width: 767px) {
  .card {
    max-width: 100%;
    margin: 0;
  }
}

/* 平板端 */
@media (min-width: 768px) and (max-width: 1023px) {
  .card {
    max-width: 40%;
  }
}

/* 大屏幕电脑 */
@media (min-width: 1024px) and (max-width: 1439px) {
  /* .card { max-width: 22%; } */
}

/* 超大屏幕 */
@media (min-width: 1440px) {
  /* .card { max-width: 18%; } */
}
```

### 说明

- 手机端卡片占满全宽,无边距
- 平板端卡片宽度为40%,可并排显示两个卡片
- 大屏幕和超大屏幕的卡片宽度配置已注释,可根据实际需求启用
