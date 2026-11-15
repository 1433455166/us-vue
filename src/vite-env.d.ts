/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** 后端接口/WebSocket 地址，本地 192.168.31.39:731，线上 103.236.89.43:31135 */
    readonly VITE_ADDRESS: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
