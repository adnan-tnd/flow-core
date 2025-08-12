import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:3000', // Allow your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific methods
    allowedHeaders: ['Content-Type', 'Accept'], // Allow specific headers
    credentials: true, // Optional: if you need cookies or auth headers
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Authentication API')
    .setDescription('API for user authentication, including signup, login, and password reset')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 8000;
  await app.listen(port);

  console.log(`Server run successfully on port: ${ await app.getUrl()}`);
}
bootstrap();