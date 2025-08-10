import {ipcMain} from 'electron';
import {FileService} from '@/services/FileService';

export class IPCManager {
  private fileService = new FileService();

  public registerHandlers() {
    ipcMain.handle('file:read', async (_, filePath: string) => {
      return this.fileService.read(filePath);
    });

    ipcMain.handle('file:write', async (_, {filePath, content}) => {
      return this.fileService.write(filePath, content);
    });
  }
}
