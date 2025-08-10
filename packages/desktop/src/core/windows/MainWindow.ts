import path from 'path';
import {BaseWindow} from './BaseWindow';
import {PUBLIC} from '@/config/env';

export class MainWindow extends BaseWindow {
  protected width = 1200;
  protected height = 800;
  protected htmlFile = path.join(PUBLIC, 'index.html');
}
