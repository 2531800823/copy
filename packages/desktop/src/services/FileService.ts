import fs from 'fs/promises';
import { existsSync, statSync, createReadStream, createWriteStream } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { IService } from '../core/ServiceContainer';
import logger from './LoggerService';

/**
 * 文件操作选项
 */
export interface FileOptions {
  encoding?: BufferEncoding;
  flag?: string;
  mode?: number;
}

/**
 * 目录操作选项
 */
export interface DirectoryOptions {
  recursive?: boolean;
  mode?: number;
}

/**
 * 文件统计信息
 */
export interface FileStats {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  mtime: Date;
  ctime: Date;
  atime: Date;
}

/**
 * 文件服务
 * 提供统一的文件系统操作接口
 */
export class FileService implements IService {
  public readonly name = 'file';
  public readonly singleton = true;

  /**
   * 初始化文件服务
   */
  public async initialize(): Promise<void> {
    logger.info('FileService', '文件服务初始化完成');
  }

  /**
   * 检查文件或目录是否存在
   * @param filePath 文件路径
   */
  public exists(filePath: string): boolean {
    return existsSync(filePath);
  }

  /**
   * 获取文件统计信息
   * @param filePath 文件路径
   */
  public async getStats(filePath: string): Promise<FileStats> {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      mtime: stats.mtime,
      ctime: stats.ctime,
      atime: stats.atime,
    };
  }

  /**
   * 同步获取文件统计信息
   * @param filePath 文件路径
   */
  public getStatsSync(filePath: string): FileStats {
    const stats = statSync(filePath);
    return {
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      mtime: stats.mtime,
      ctime: stats.ctime,
      atime: stats.atime,
    };
  }

  /**
   * 读取文件内容
   * @param filePath 文件路径
   * @param options 选项
   */
  public async read(filePath: string, options: FileOptions = {}): Promise<string> {
    const { encoding = 'utf-8' } = options;
    
    try {
      const content = await fs.readFile(filePath, { encoding });
      logger.debug('FileService', `读取文件: ${filePath}`);
      return content;
    } catch (error) {
      logger.error('FileService', `读取文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 读取文件内容（二进制）
   * @param filePath 文件路径
   */
  public async readBuffer(filePath: string): Promise<Buffer> {
    try {
      const buffer = await fs.readFile(filePath);
      logger.debug('FileService', `读取文件buffer: ${filePath}`);
      return buffer;
    } catch (error) {
      logger.error('FileService', `读取文件buffer失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 写入文件内容
   * @param filePath 文件路径
   * @param content 内容
   * @param options 选项
   */
  public async write(filePath: string, content: string | Buffer, options: FileOptions = {}): Promise<void> {
    const { encoding = 'utf-8', flag = 'w', mode } = options;
    
    try {
      // 确保目录存在
      await this.ensureDir(path.dirname(filePath));
      
      const writeOptions = { encoding, flag, mode };
      await fs.writeFile(filePath, content, writeOptions);
      
      logger.debug('FileService', `写入文件: ${filePath}`);
    } catch (error) {
      logger.error('FileService', `写入文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 追加文件内容
   * @param filePath 文件路径
   * @param content 内容
   * @param options 选项
   */
  public async append(filePath: string, content: string | Buffer, options: FileOptions = {}): Promise<void> {
    const { encoding = 'utf-8' } = options;
    
    try {
      await fs.appendFile(filePath, content, { encoding });
      logger.debug('FileService', `追加文件: ${filePath}`);
    } catch (error) {
      logger.error('FileService', `追加文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 复制文件
   * @param src 源文件路径
   * @param dest 目标文件路径
   * @param overwrite 是否覆盖
   */
  public async copy(src: string, dest: string, overwrite = true): Promise<void> {
    try {
      // 确保目标目录存在
      await this.ensureDir(path.dirname(dest));
      
      const flags = overwrite ? 0 : fs.constants.COPYFILE_EXCL;
      await fs.copyFile(src, dest, flags);
      
      logger.debug('FileService', `复制文件: ${src} -> ${dest}`);
    } catch (error) {
      logger.error('FileService', `复制文件失败: ${src} -> ${dest}`, error);
      throw error;
    }
  }

  /**
   * 移动文件
   * @param src 源文件路径
   * @param dest 目标文件路径
   */
  public async move(src: string, dest: string): Promise<void> {
    try {
      // 确保目标目录存在
      await this.ensureDir(path.dirname(dest));
      
      await fs.rename(src, dest);
      logger.debug('FileService', `移动文件: ${src} -> ${dest}`);
    } catch (error) {
      logger.error('FileService', `移动文件失败: ${src} -> ${dest}`, error);
      throw error;
    }
  }

  /**
   * 删除文件
   * @param filePath 文件路径
   */
  public async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.debug('FileService', `删除文件: ${filePath}`);
    } catch (error) {
      logger.error('FileService', `删除文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 创建目录
   * @param dirPath 目录路径
   * @param options 选项
   */
  public async createDir(dirPath: string, options: DirectoryOptions = {}): Promise<void> {
    const { recursive = true, mode } = options;
    
    try {
      await fs.mkdir(dirPath, { recursive, mode });
      logger.debug('FileService', `创建目录: ${dirPath}`);
    } catch (error) {
      logger.error('FileService', `创建目录失败: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * 确保目录存在
   * @param dirPath 目录路径
   */
  public async ensureDir(dirPath: string): Promise<void> {
    if (!this.exists(dirPath)) {
      await this.createDir(dirPath);
    }
  }

  /**
   * 读取目录内容
   * @param dirPath 目录路径
   */
  public async readDir(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      logger.debug('FileService', `读取目录: ${dirPath}, 文件数: ${files.length}`);
      return files;
    } catch (error) {
      logger.error('FileService', `读取目录失败: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * 删除目录
   * @param dirPath 目录路径
   * @param recursive 是否递归删除
   */
  public async deleteDir(dirPath: string, recursive = true): Promise<void> {
    try {
      await fs.rmdir(dirPath, { recursive });
      logger.debug('FileService', `删除目录: ${dirPath}`);
    } catch (error) {
      logger.error('FileService', `删除目录失败: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * 流式复制文件
   * @param src 源文件路径
   * @param dest 目标文件路径
   */
  public async streamCopy(src: string, dest: string): Promise<void> {
    try {
      // 确保目标目录存在
      await this.ensureDir(path.dirname(dest));
      
      const srcStream = createReadStream(src);
      const destStream = createWriteStream(dest);
      
      await pipeline(srcStream, destStream);
      logger.debug('FileService', `流式复制文件: ${src} -> ${dest}`);
    } catch (error) {
      logger.error('FileService', `流式复制文件失败: ${src} -> ${dest}`, error);
      throw error;
    }
  }

  /**
   * 获取文件扩展名
   * @param filePath 文件路径
   */
  public getExtension(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * 获取文件名（不含扩展名）
   * @param filePath 文件路径
   */
  public getBasename(filePath: string): string {
    return path.basename(filePath, this.getExtension(filePath));
  }

  /**
   * 获取目录路径
   * @param filePath 文件路径
   */
  public getDirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * 解析路径
   * @param filePath 文件路径
   */
  public parsePath(filePath: string) {
    return path.parse(filePath);
  }

  /**
   * 连接路径
   * @param paths 路径片段
   */
  public joinPath(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * 规范化路径
   * @param filePath 文件路径
   */
  public normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * 销毁服务
   */
  public async destroy(): Promise<void> {
    logger.info('FileService', '文件服务已销毁');
  }
}

/**
 * 创建文件服务实例
 */
export function createFileService(): FileService {
  return new FileService();
}
