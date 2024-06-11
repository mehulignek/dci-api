import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression';
import * as rTracer from 'cls-rtracer';
import { json, urlencoded } from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  Logger,
  ApiLoggerMiddleware,
  DistributedTracingMiddleware,
} from 'dci-commons';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const appPort = process.env.PORT || 9000;

  const app = await NestFactory.create(AppModule, {
    logger: Logger,
  });
  app.use(rTracer.expressMiddleware(), ApiLoggerMiddleware);
  app.use(DistributedTracingMiddleware());
  app.use(compression());
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
    }),
  );
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const config = new DocumentBuilder()
    .setTitle('DCI API')
    .setDescription('DCI APIs description')
    .setVersion('1.0')
    .addTag('dci')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.enableCors();

  process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception', error);
  });

  process.on('unhandledRejection', (error) => {
    Logger.error('Unhandled Rejection', error as object);
  });

  Logger.log('Starting server on...' + appPort, 'Initiated');
  await app.listen(appPort);
  Logger.log('Server started', 'Successful');
}
bootstrap();
