"""
统一启动脚本 - 一键启动所有服务
Start All Services Script

启动顺序:
1. AKShare 数据服务 (port 8000)
2. ML 推理服务 (port 8002)
3. Node.js API 服务 (port 3001, 含 WebSocket)
4. (可选) Desktop App (Electron)

用法:
  python scripts/start_all.py          # 启动所有后端服务
  python scripts/start_all.py --all    # 启动所有服务(含Desktop)
  python scripts/start_all.py --check  # 仅检查服务状态
"""

import subprocess
import sys
import os
import time
import signal
import argparse
from pathlib import Path

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
processes = []


def log(msg, level="INFO"):
    colors = {"INFO": "\033[94m", "OK": "\033[92m", "WARN": "\033[93m", "ERR": "\033[91m", "END": "\033[0m"}
    c = colors.get(level, "")
    e = colors["END"]
    print(f"{c}[{level}]{e} {msg}")


def check_port(port):
    """检查端口是否已被占用"""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0


def start_service(name, cmd, cwd, port, env=None):
    """启动单个服务"""
    if check_port(port):
        log(f"{name} 已在 port {port} 运行，跳过", "WARN")
        return None

    log(f"启动 {name} (port {port})...")
    full_env = {**os.environ, **(env or {})}

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(cwd),
            env=full_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=True,
            encoding='utf-8',
            errors='replace',
        )
        processes.append((name, proc, port))

        # 等待服务启动
        for i in range(15):
            time.sleep(1)
            if check_port(port):
                log(f"{name} 启动成功 -> http://localhost:{port}", "OK")
                return proc
            if proc.poll() is not None:
                output = proc.stdout.read() if proc.stdout else ""
                log(f"{name} 启动失败 (exit={proc.returncode}): {output[:500]}", "ERR")
                return None

        log(f"{name} 启动超时 (15s)，但进程仍在运行", "WARN")
        return proc

    except Exception as e:
        log(f"{name} 启动异常: {e}", "ERR")
        return None


def check_all():
    """检查所有服务状态"""
    services = [
        ("AKShare 数据服务", 8000),
        ("ML 推理服务", 8002),
        ("Node.js API 服务", 3001),
    ]
    print("\n" + "=" * 50)
    print("  In Fortune AI 服务状态检查")
    print("=" * 50)
    all_ok = True
    for name, port in services:
        online = check_port(port)
        status = "\033[92m● 在线\033[0m" if online else "\033[91m○ 离线\033[0m"
        print(f"  {status}  {name} (port {port})")
        if not online:
            all_ok = False
    print("=" * 50)
    if all_ok:
        print("  \033[92m所有服务运行正常!\033[0m")
    else:
        print("  \033[93m部分服务未启动，请运行: python scripts/start_all.py\033[0m")
    print()
    return all_ok


def start_all(include_desktop=False):
    """启动所有服务"""
    print("\n" + "=" * 50)
    print("  In Fortune AI - 一键启动所有服务")
    print("=" * 50 + "\n")

    # 1. AKShare 数据服务
    akshare_dir = ROOT_DIR / "akshare"
    if akshare_dir.exists():
        start_service(
            "AKShare 数据服务",
            f"{sys.executable} -m uvicorn app:app --host 0.0.0.0 --port 8000",
            akshare_dir, 8000
        )
    else:
        log("akshare/ 目录不存在，跳过", "WARN")

    # 2. ML 推理服务
    start_service(
        "ML 推理服务",
        f"{sys.executable} -m uvicorn ml_services.inference_service:app --host 0.0.0.0 --port 8002",
        ROOT_DIR, 8002
    )

    # 3. Node.js API 服务 (含 WebSocket)
    website_dir = ROOT_DIR / "website"
    if website_dir.exists():
        start_service(
            "Node.js API 服务",
            "node server/index.js",
            website_dir, 3001
        )
    else:
        log("website/ 目录不存在，跳过", "WARN")

    # 4. (可选) Desktop App
    if include_desktop:
        desktop_dir = ROOT_DIR / "desktop-app"
        if desktop_dir.exists():
            log("启动 Desktop App (Electron)...")
            try:
                proc = subprocess.Popen(
                    "npx electron .",
                    cwd=str(desktop_dir),
                    shell=True,
                )
                processes.append(("Desktop App", proc, 0))
                log("Desktop App 已启动", "OK")
            except Exception as e:
                log(f"Desktop App 启动失败: {e}", "ERR")

    # 状态汇总
    time.sleep(1)
    check_all()

    print("按 Ctrl+C 停止所有服务\n")


def cleanup(signum=None, frame=None):
    """清理所有子进程"""
    log("\n正在停止所有服务...")
    for name, proc, port in processes:
        if proc and proc.poll() is None:
            try:
                proc.terminate()
                proc.wait(timeout=5)
                log(f"{name} 已停止", "OK")
            except subprocess.TimeoutExpired:
                proc.kill()
                log(f"{name} 已强制终止", "WARN")
            except Exception:
                pass
    log("所有服务已停止", "OK")
    sys.exit(0)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="In Fortune AI 服务启动脚本")
    parser.add_argument("--all", action="store_true", help="启动所有服务(含Desktop App)")
    parser.add_argument("--check", action="store_true", help="仅检查服务状态")
    args = parser.parse_args()

    if args.check:
        check_all()
        sys.exit(0)

    # 注册信号处理
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    start_all(include_desktop=args.all)

    # 保持运行
    try:
        while True:
            time.sleep(1)
            # 检查子进程是否意外退出
            for name, proc, port in processes:
                if proc and proc.poll() is not None:
                    log(f"{name} 意外退出 (exit={proc.returncode})", "WARN")
    except KeyboardInterrupt:
        cleanup()
