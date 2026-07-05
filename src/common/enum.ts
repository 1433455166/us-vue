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

// java 接口地址 731
// 本地 192.168.31.40
// 线上环境 115.190.127.28
export const ADDRESS = "192.168.31.40:731"