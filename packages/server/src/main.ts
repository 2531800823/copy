import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';

async function bootstrap() {
  const port = process.env.PORT ?? 7011;
  const app = await NestFactory.create(AppModule);

  /** 启用 CORS 支持跨域请求 */
  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  /** 设置全局 API 前缀 */
  app.setGlobalPrefix('api');

  await app.listen(port);
  console.log(`🚀 liu123 ~ 启动： http://localhost:${port}/api`);
}
bootstrap();
