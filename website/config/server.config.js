/**
 * In Fortune AI 服务端配置文件
 */
export const SERVER_CONFIG = {
  // API 服务器端口
  API_PORT: process.env.API_PORT || 3001,
  
  // 前端开发服务器端口
  FRONTEND_PORT: process.env.FRONTEND_PORT || 5173,
  
  // 数据库配置
  DB_FILE_PATH: './server/data/db.json'
};

export default SERVER_CONFIG;