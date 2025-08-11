import fs from 'node:fs';
import path from 'node:path';
import {app, protocol} from 'electron';
import {createLogger} from './services/LoggerService';
import { getRendererPath } from './utils/getRendererPath';
import { isDev } from './config/env';

const logger = createLogger('protocol');

/**
 * 设置自定义协议，解决静态资源加载问题
 */
export function setupProtocol() {
  if (isDev) {
    logger.debug('Protocol', `开发环境无需设置app://协议`);
    return;
  }

  const RENDERER_DIST = getRendererPath();
  logger.info(
    'Protocol',
    `设置app://协议处理器，使用资源目录: ${RENDERER_DIST}`
  );
  logger.info('Protocol', `应用执行路径: ${app.getPath('exe')}`);
  logger.info('Protocol', `应用根目录: ${app.getAppPath()}`);

  try {
    // 检查资源目录是否存在
    if (!fs.existsSync(RENDERER_DIST)) {
      logger.error('Protocol', `资源目录不存在: ${RENDERER_DIST}`);

      // 尝试查找备选目录
      const alternativePaths = [
        path.join(app.getAppPath(), '../web/dist'), // 相对于app根目录
        path.join(app.getPath('exe'), '../resources/web/dist'), // 相对于exe路径
        path.join(app.getPath('exe'), '../resources/app.asar/dist'), // 默认asar包位置
        path.join(app.getPath('userData'), '../web/dist'), // 用户数据目录
      ];

      logger.info('Protocol', `尝试查找备选目录...`);

      let foundAlternative = false;
      for (const altPath of alternativePaths) {
        logger.debug('Protocol', `检查备选目录: ${altPath}`);
        if (fs.existsSync(altPath)) {
          logger.info('Protocol', `找到可用的备选目录: ${altPath}`);
          // 尝试列出内容
          try {
            const files = fs.readdirSync(altPath);
            logger.debug('Protocol', `备选目录内容: ${files.join(', ')}`);
            foundAlternative = true;
          } catch (err) {
            logger.error('Protocol', `无法读取备选目录内容: ${err}`);
          }
        }
      }

      if (!foundAlternative) {
        logger.error('Protocol', `未找到任何可用的资源目录`);
      }
    } else {
      // 检查index.html是否存在
      const indexPath = path.join(RENDERER_DIST, 'index.html');
      if (fs.existsSync(indexPath)) {
        logger.info('Protocol', `检测到index.html文件: ${indexPath}`);
      } else {
        logger.error('Protocol', `index.html文件不存在: ${indexPath}`);
      }

      // 列出目录内容
      try {
        const files = fs.readdirSync(RENDERER_DIST);
        logger.debug('Protocol', `资源目录内容: ${files.join(', ')}`);
      } catch (err) {
        logger.error('Protocol', `无法读取资源目录内容: ${err}`);
      }
    }
  } catch (error) {
    logger.error('Protocol', `检查资源目录时发生错误: ${error}`);
  }

  // 注册app协议
  protocol.handle('app', async (request): Promise<any> => {
    const url = request.url.slice('app://'.length);
    const decodedUrl = decodeURI(url);

    logger.debug('Protocol', `收到app://请求: ${decodedUrl}`);

    try {
      // 判断是否为静态资源
      const isStatic = /\.[a-z0-9]+$/i.test(decodedUrl);

      let filePath;
      if (
        !decodedUrl ||
        decodedUrl === './' ||
        decodedUrl === '.' ||
        !isStatic
      ) {
        // 返回 index.html
        filePath = path.join(RENDERER_DIST, 'index.html');
      } else {
        // 返回真实静态资源
        filePath = path.join(RENDERER_DIST, decodedUrl);
      }

      logger.debug('Protocol', `请求资源: ${request.url} -> ${filePath}`);

      // 读取文件内容
      if (!fs.existsSync(filePath)) {
        logger.error(
          'Protocol',
          `文件不存在: ${filePath}，尝试查找其他可能的路径`
        );

        // 尝试处理以/开头的绝对路径请求（如/assets/xx.js）
        if (decodedUrl.startsWith('/')) {
          const altPath = path.join(RENDERER_DIST, decodedUrl.slice(1));
          if (fs.existsSync(altPath)) {
            logger.debug('Protocol', `找到替代路径: ${altPath}`);
            filePath = altPath;
          } else {
            logger.error('Protocol', `替代路径也不存在: ${altPath}`);
            return new Response('File Not Found', {status: 404});
          }
        } else {
          return new Response('File Not Found', {status: 404});
        }
      }

      // 获取MIME类型
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
      };

      const ext = path.extname(filePath).toLowerCase();
      const mimeType = mimeTypes[ext] || 'application/octet-stream';

      // 读取文件并返回Buffer
      const data = fs.readFileSync(filePath);
      logger.debug(
        'Protocol',
        `成功加载资源: ${filePath}, 大小: ${data.length} 字节, MIME: ${mimeType}`
      );

      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
        },
      });
    } catch (error: any) {
      logger.error('Protocol', `处理请求时出错: ${error.message}`, error);
      return new Response('Internal Server Error', {status: 500});
    }
  });
}
