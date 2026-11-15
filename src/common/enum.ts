// 设备类型
export enum DEVICE_TYPE{
  phone = 'phone', // 手机
  tablet = 'tablet', // 平板
  desktop = 'desktop', // 桌面
};

// 路由类型
export enum ROUTER_TYPE {
  bookList = 'bookList', // 小说列表
  declaration = 'declaration', // 网站声明
  musicList = 'musicList', // 音乐列表
};

// java 接口地址
// 通过 Vite 环境变量 VITE_ADDRESS 区分环境：
//   本地开发 (.env.development) 192.168.31.39:731
//   线上部署   (.env.production) 103.236.89.43:31135
export const ADDRESS = import.meta.env.VITE_ADDRESS || "192.168.31.39:731"