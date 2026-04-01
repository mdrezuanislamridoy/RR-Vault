/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { SwaggerSetting } from './config/swagger/swagger';

// BigInt JSON serialization fix
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  SwaggerSetting(app);

  const port = process.env.PORT ?? 8888;
  await app.listen(port);
  console.log(
    `Server is listening on port: ${port}, http://localhost:${process.env.PORT}/docs`,
  );
}
bootstrap();
