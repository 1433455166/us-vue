/**
 * 设备判断工具
 * 通过 User-Agent 判断是否为移动设备。
 * 手机浏览器、DevTools 移动设备模式（模拟器会发送移动端 UA）都会被识别为移动端，
 * 只有真实 PC 浏览器会被识别为桌面端。
 */

// iPadOS 13+ 的 Safari 会伪装成 Mac UA，需要借助触点数辅助判断
function isIpadOS() {
    return /Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
}

/**
 * 是否为移动设备
 * @returns {boolean} true 表示移动端（含移动模拟模式），false 表示 PC 桌面端
 */
export function isMobileDevice() {
    const ua = navigator.userAgent;
    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua) ||
        isIpadOS()
    );
}

/**
 * 是否为 PC 桌面设备
 * @returns {boolean}
 */
export function isPcDevice() {
    return !isMobileDevice();
}
