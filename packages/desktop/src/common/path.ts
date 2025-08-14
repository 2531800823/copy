import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {app} from 'electron';
import {PROTOCOL} from './protocol';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const appUserData = path.join(
  app.getPath('appData'),
  `${PROTOCOL}/${PROTOCOL}_app_data`
);

/** 存放用户数据 */
export const dataPath = path.join(appUserData, PROTOCOL);
