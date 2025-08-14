import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';

async function bootstrap() {
  const port = process.env.PORT ?? 7011;
  const app = await NestFactory.create(AppModule);
  await app.listen(port);
  console.log(`🚀 liu123 ~ 启动： http://localhost:${port}`);
}
bootstrap();
