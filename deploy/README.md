# MindForAI 启动与部署脚本说明

一键启动脚本已移动到**项目根目录**，本目录仅保留说明文档。

| 需求 | Windows（双击） | macOS | Linux | 通用 |
| --- | --- | --- | --- | --- |
| 本地源码开发 | `runsrc.bat` | `bash runsrc.sh` | `bash runsrc.sh` | `bash runsrc.sh` |
| Docker 部署 | `rundocker.bat` | `bash rundocker-macos.sh` | `bash rundocker-linux.sh` | `bash rundocker.sh` |

## 前置条件

- 本地源码开发：Node.js 20 或更高版本（npm 随附）
- Docker 部署：Docker（含 Docker Desktop），不需要 Docker Compose

## 本地源码启动（runsrc）

1. 检查 Node.js / npm，版本低于 20 时给出提示
2. 首次运行时自动执行 `npm install` 安装依赖
3. 停止上一次启动的实例（读取 `.mindforai.pid`，或回收属于本项目的旧端口进程）
4. 后台启动 Vite 开发服务器，日志写入 `.mindforai.log`
5. 端口可访问后用默认浏览器打开 <http://localhost:7200>

再次双击 / 再次执行即**重启**；停止命令：

```bash
bash runsrc.sh stop        # Windows：runsrc.bat stop
```

端口 7200 被其它程序占用时，会自动顺延到下一个可用端口并提示。

## Docker 部署（rundocker）

1. 检查 Docker 是否可用
2. 构建 `mindforai:latest` 镜像（多阶段构建：Node 构建 → 静态站点镜像）
3. 用 `docker run --rm -d` 启动 `mindforai` 容器，宿主机端口映射到容器 80
4. 轮询站点地址直到服务就绪
5. 用默认浏览器打开 <http://localhost:8080>
6. 脚本退出，容器保持运行

容器带 `--rm` 参数：**只要容器停止，Docker 就会自动删除它**，包括：

- 在 Docker Desktop 中点击停止按钮
- 执行 `docker stop mindforai`
- 执行 `bash rundocker.sh stop`（Windows：`rundocker.bat stop`）

再次运行脚本时会先删除同名旧容器，再重新构建并启动，不会残留历史容器。

### 构建时报 auth.docker.io EOF / 拉取元数据超时

这是 Docker 无法访问 Docker Hub（网络、代理、DNS 或镜像源问题），不是脚本逻辑错误。脚本的处理方式：

1. 构建失败后自动重试一次
2. 仍然失败时，如果本地已存在 `mindforai:latest` 镜像，则打印警告并直接用该镜像启动容器
3. 本地也没有镜像时才报错退出

因此第二次运行即使网络短暂不可用，也能用上次构建好的镜像把服务拉起来。要使用最新代码，请恢复网络后重新运行脚本。

## 自定义端口

```bash
MINDFORAI_PORT=9000 bash rundocker.sh
```

Windows 在系统环境变量中设置 `MINDFORAI_PORT` 后双击 `rundocker.bat` 即可。

## Windows 中文乱码处理

- `.bat` 文件为 UTF-8 无 BOM（带 BOM 会让 cmd 解析首行出错），开头执行 `chcp 65001` 切换控制台代码页
- `.ps1` 文件为 UTF-8 **带 BOM**，保证 Windows PowerShell 5.1 也能正确按 UTF-8 读取中文；脚本内再显式设置 `[Console]::OutputEncoding` 为 UTF-8
- `.bat` 只负责调用 PowerShell，提示文本全部放在 `.ps1` 中，避免 cmd.exe 二次解析多字节字符
- 优先使用 `pwsh`（PowerShell 7），未安装时回退到系统自带 `powershell`

## 常用运维命令

```bash
docker logs -f mindforai      # 查看运行日志
docker stop mindforai         # 停止服务（--rm 会自动删除容器）
docker rm -f mindforai        # 强制删除容器
docker compose up -d          # 可选：改用 docker-compose 手动启动
docker compose down           # 可选：用 compose 停止并删除
```

> `docker compose` 不支持 `--rm`，若改用 compose 启动，停止后容器会保留，需要执行 `docker compose down` 才能删除。脚本默认的 `docker run --rm` 方式没有这个问题。
