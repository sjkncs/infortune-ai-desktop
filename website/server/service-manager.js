/**
 * 服务管理模块 - 管理项目服务的启动、停止、重启
 */
import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录 - 修正路径计算
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// 检测 Windows 环境
const isWindows = process.platform === 'win32';

// 服务配置
const SERVICES = {
  akshare: {
    name: 'AKShare 数据服务',
    description: 'Python 实时行情数据服务',
    port: 8000,
    directory: 'akshare',
    startCommand: isWindows ? 'python' : 'python3',
    startArgs: ['start.py'],
    healthEndpoint: '/docs',
    type: 'python'
  },
  baostock: {
    name: 'BaoStock 数据服务',
    description: 'Python 财务数据服务',
    port: 8001,
    directory: 'baostock',
    startCommand: isWindows ? 'python' : 'python3',
    startArgs: ['start.py'],
    healthEndpoint: '/docs',
    type: 'python'
  },
  website: {
    name: 'Website 前端服务',
    description: '用户前端开发服务器',
    port: 5173,
    directory: 'website',
    startCommand: isWindows ? 'npm.cmd' : 'npm',
    startArgs: ['run', 'dev'],
    healthEndpoint: '/',
    type: 'node'
  }
};

// 存储运行中的进程
const runningProcesses = new Map();

/**
 * 检查服务是否运行
 */
async function checkServiceStatus(serviceId) {
  const service = SERVICES[serviceId];
  if (!service) return { running: false, error: '未知服务' };

  try {
    const response = await axios.get(`http://localhost:${service.port}${service.healthEndpoint}`, {
      timeout: 3000,
      validateStatus: () => true
    });
    return { 
      running: response.status >= 200 && response.status < 500,
      port: service.port,
      url: `http://localhost:${service.port}`
    };
  } catch (error) {
    return { 
      running: false, 
      port: service.port,
      error: error.message 
    };
  }
}

/**
 * 获取所有服务状态
 */
async function getAllServiceStatus() {
  const results = {};
  for (const [id, config] of Object.entries(SERVICES)) {
    try {
      const status = await checkServiceStatus(id);
      results[id] = {
        id,
        ...config,
        status: status.running ? 'running' : 'stopped',
        port: status.port,
        url: status.url,
        error: status.error,
        pid: runningProcesses.get(id)?.pid || null
      };
    } catch (error) {
      // 单个服务检查失败，仍然返回该服务但标记为错误状态
      console.error(`[ServiceManager] 检查 ${id} 服务状态失败:`, error.message);
      results[id] = {
        id,
        ...config,
        status: 'error',
        port: config.port,
        url: `http://localhost:${config.port}`,
        error: error.message,
        pid: null
      };
    }
  }
  return results;
}

/**
 * 启动服务
 */
async function startService(serviceId) {
  const service = SERVICES[serviceId];
  if (!service) {
    return { success: false, message: '未知服务' };
  }

  // 检查是否已经在运行
  const currentStatus = await checkServiceStatus(serviceId);
  if (currentStatus.running) {
    return { success: false, message: '服务已经在运行中' };
  }

  try {
    const servicePath = path.join(PROJECT_ROOT, service.directory);
    
    console.log(`[ServiceManager] 启动 ${service.name}...`);
    console.log(`[ServiceManager] 项目根目录: ${PROJECT_ROOT}`);
    console.log(`[ServiceManager] 工作目录: ${servicePath}`);
    console.log(`[ServiceManager] 命令: ${service.startCommand} ${service.startArgs.join(' ')}`);
    console.log(`[ServiceManager] 平台: ${process.platform}`);

    // Windows 下使用不同的 spawn 配置
    let spawnOptions;
    if (isWindows) {
      // Windows: 使用 cmd /c 执行命令
      spawnOptions = {
        cwd: servicePath,
        detached: false,
        stdio: 'pipe',
        windowsHide: false,
        env: { ...process.env }
      };
    } else {
      // Linux/Mac
      spawnOptions = {
        cwd: servicePath,
        detached: true,
        stdio: 'pipe',
        env: { ...process.env }
      };
    }

    let childProcess;
    
    try {
      if (isWindows) {
        // Windows: 使用 cmd /c start 在新窗口中执行
        // 构建完整的命令字符串
        const command = `${service.startCommand} ${service.startArgs.join(' ')}`;
        childProcess = spawn('cmd', ['/c', 'start', 'cmd', '/k', command], spawnOptions);
      } else {
        // Linux/Mac: 直接执行
        childProcess = spawn(service.startCommand, service.startArgs, spawnOptions);
      }
    } catch (spawnError) {
      console.error(`[ServiceManager] spawn 失败:`, spawnError);
      return { success: false, message: `进程创建失败: ${spawnError.message}` };
    }

    if (!childProcess || !childProcess.pid) {
      return { success: false, message: '进程创建失败' };
    }

    if (!childProcess) {
      return { success: false, message: '进程创建失败' };
    }

    // 存储进程信息
    runningProcesses.set(serviceId, {
      pid: childProcess.pid,
      startTime: new Date().toISOString()
    });

    // 监听进程输出
    childProcess.stdout?.on('data', (data) => {
      console.log(`[${service.name}] ${data.toString().trim()}`);
    });

    childProcess.stderr?.on('data', (data) => {
      console.error(`[${service.name}] ${data.toString().trim()}`);
    });

    childProcess.on('error', (error) => {
      console.error(`[ServiceManager] ${service.name} 进程错误:`, error);
      runningProcesses.delete(serviceId);
    });

    childProcess.on('exit', (code) => {
      console.log(`[ServiceManager] ${service.name} 已退出，退出码: ${code}`);
      runningProcesses.delete(serviceId);
    });

    // 等待服务启动（给更多时间）
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // 检查服务是否成功启动
    const newStatus = await checkServiceStatus(serviceId);
    
    if (newStatus.running) {
      return { 
        success: true, 
        message: '服务启动成功',
        pid: childProcess.pid,
        port: service.port,
        url: `http://localhost:${service.port}`
      };
    } else {
      // 启动可能还在进行中，给更多时间
      await new Promise(resolve => setTimeout(resolve, 5000));
      const retryStatus = await checkServiceStatus(serviceId);
      
      if (retryStatus.running) {
        return { 
          success: true, 
          message: '服务启动成功',
          pid: childProcess.pid,
          port: service.port,
          url: `http://localhost:${service.port}`
        };
      }
      
      // 启动失败，清理进程记录（但不杀死进程，可能还在启动中）
      runningProcesses.delete(serviceId);
      return { success: false, message: '服务启动超时，请稍后刷新查看状态' };
    }

  } catch (error) {
    console.error(`[ServiceManager] 启动 ${service.name} 失败:`, error);
    runningProcesses.delete(serviceId);
    return { success: false, message: `启动失败: ${error.message}` };
  }
}

/**
 * 停止服务
 */
async function stopService(serviceId) {
  const service = SERVICES[serviceId];
  if (!service) {
    return { success: false, message: '未知服务' };
  }

  const processInfo = runningProcesses.get(serviceId);
  
  if (processInfo && processInfo.pid) {
    try {
      // Windows 上使用 taskkill
      if (isWindows) {
        await execAsync(`taskkill /PID ${processInfo.pid} /T /F`);
      } else {
        // Linux/Mac 上使用 kill
        process.kill(processInfo.pid, 'SIGTERM');
      }
      
      runningProcesses.delete(serviceId);
      
      // 等待确认停止
      await new Promise(resolve => setTimeout(resolve, 2000));
      const status = await checkServiceStatus(serviceId);
      
      if (!status.running) {
        return { success: true, message: '服务已停止' };
      } else {
        return { success: false, message: '服务停止失败，请手动关闭' };
      }
      
    } catch (error) {
      console.error(`[ServiceManager] 停止 ${service.name} 失败:`, error);
      runningProcesses.delete(serviceId);
      return { success: false, message: `停止失败: ${error.message}` };
    }
  } else {
    // 尝试通过端口查找并终止进程（Windows）
    if (isWindows) {
      try {
        const { stdout } = await execAsync(`netstat -ano | findstr :${service.port}`);
        if (stdout) {
          const lines = stdout.split('\n');
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(parseInt(pid))) {
              await execAsync(`taskkill /PID ${pid} /T /F`);
              return { success: true, message: '服务已停止' };
            }
          }
        }
        return { success: true, message: '服务未运行' };
      } catch (error) {
        // 没有找到进程或服务已经停止
        return { success: true, message: '服务未运行' };
      }
    }
    
    return { success: true, message: '服务未运行' };
  }
}

/**
 * 重启服务
 */
async function restartService(serviceId) {
  try {
    // 先停止
    const stopResult = await stopService(serviceId);
    console.log(`[ServiceManager] 停止结果:`, stopResult);
    
    // 等待服务完全停止
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 再启动
    const startResult = await startService(serviceId);
    console.log(`[ServiceManager] 启动结果:`, startResult);
    
    return {
      success: startResult.success,
      message: startResult.success 
        ? '服务重启成功' 
        : `停止: ${stopResult.message}, 启动: ${startResult.message}`,
      data: startResult
    };
  } catch (error) {
    console.error(`[ServiceManager] 重启服务失败:`, error);
    return { 
      success: false, 
      message: `重启失败: ${error.message}` 
    };
  }
}

export default {
  getAllServiceStatus,
  checkServiceStatus,
  startService,
  stopService,
  restartService,
  SERVICES
};
