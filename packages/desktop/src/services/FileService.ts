import {readFileSync, writeFileSync} from 'fs';

export class FileService {
  public read(filePath: string) {
    return readFileSync(filePath, 'utf-8');
  }

  public write(filePath: string, content: string) {
    writeFileSync(filePath, content, 'utf-8');
    return true;
  }
}
