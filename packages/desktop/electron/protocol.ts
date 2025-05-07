import fs from 'node:fs';
import path from 'node:path';
import { net, protocol } from 'electron';
import logger from './logger';
import { isDev, RENDERER_DIST } from './main';

/**
 * 设置自定义协议，解决静态资源加载问题
 */
export function setupProtocol() {
  if (isDev) {
    return;
  }

  logger.debug('Protocol', '设置app://协议处理器');

  // 注册app协议
  protocol.handle('app', (request) => {
    const url = request.url.slice('app://'.length);
    const decodedUrl = decodeURI(url);

    try {
      // 如果URL是根路径，直接返回index.html
      let filePath;
      if (decodedUrl === './' || decodedUrl === '.') {
        filePath = path.join(RENDERER_DIST, 'index.html');
      }
      else {
        // 否则尝试从渲染进程的dist目录解析文件
        filePath = path.join(RENDERER_DIST, decodedUrl);
      }

      logger.debug('Protocol', `请求资源: ${request.url} -> ${filePath}`);
      console.log('请求资源:', request.url, '->>', filePath);

      // 检查文件是否存在
      if (fs.existsSync(filePath)) {
        return net.fetch(`file://${filePath}`);
      }

      logger.warn('Protocol', `文件不存在: ${filePath}`);
      console.warn(`文件不存在: ${filePath}`);
      return new Response(null, { status: 404 });
    }
    catch (error) {
      logger.error('Protocol', '加载资源失败', error);
      console.error('加载资源失败:', error);
      return new Response(null, { status: 500 });
    }
  });
}
