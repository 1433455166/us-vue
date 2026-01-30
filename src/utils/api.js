import request from "./request";
// 获取小说三体 第一部 数据
export const getTrisomy = () => request.get("/lz-api/threeBody.one");

// 获取小说三体 数据
export const getThreeBodyData = (params) => request.post("/lz-api/threeBody", params);

// 获取 每日弹窗 数据
export const getPopDaily = () => request.get("/lz-api/pop.daily");