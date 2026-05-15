import message from './message';

// 添加超时控制的辅助函数
const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  // 设置超时定时器
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  return fetch(url, { ...options, signal })
    .then(response => {
      clearTimeout(timeoutId);
      return response;
    })
    .catch(error => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    });
};

const request = {
  get(url, params) {
    if (params) {
      url += "?";
      let arr = [];
      for (const key in params) {
        arr.push(key + "=" + params[key]);
      }
      url += arr.join("&");
    }
    
    return new Promise((resolve, reject) => {
      fetchWithTimeout('lzApi' + url)
        .then((response) => response.json())
        .then((res) => {
          if (res.success) {
            resolve(res);
          } else {
            // 显示错误提示
            const errorMsg = res.msg || "请求失败";
            message.error(errorMsg);
            reject(res);
          }
        }).catch(err => {
            // 显示错误提示
            const errorMsg = err?.message || err || "请求失败";
            message.error(errorMsg);
            reject(err);
        });
    });
  },
  post(url, data) {
    return new Promise((resolve, reject) => {
      fetchWithTimeout('lzApi' + url, {
        method: "POST",
        body: JSON.stringify({
          ...data,
        }),
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.success) {
            resolve(res);
          } else {
            // 显示错误提示
            const errorMsg = res?.msg || res?.message || "请求失败";
            message.error(errorMsg);
            reject(res);
          }
        }).catch(err => {
            // 显示错误提示
            const errorMsg = err?.message || err || "请求失败";
            message.error(errorMsg);
            reject(err);
        });
    });
  },
};

export default request;