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
      fetch('lzApi' + url)
        .then((response) => response.json())
        .then((res) => {
          if (res.success) {
            resolve(res);
          } else {
            reject(res);
            alert(res.msg);
          }
        });
    });
  },
  post(url, data) {
    return new Promise((resolve, reject) => {
      fetch('lzApi' + url, {
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
            reject(res);
            alert(res?.msg || res?.message || "请求失败");
          }
        });
    });
  },
};

export default request;
