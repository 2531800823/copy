import { isDev } from ".";

export const PROTOCOL = 'liuCopy';

export const HOST = isDev ? 'localhost:7010' : 'liu.com';

export const LOCATION = isDev ? `http://${HOST}` : `${PROTOCOL}://${HOST}`;

export const pathRouter = ['app'];

export function isPathRouter(path: string) {
  return pathRouter.some((item) => {
    return path.startsWith(item);
  });
}
