import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

// Prevent uncaught errors from terminating
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("exit", (code) => {
  console.log(`⚠️  Process exit with code: ${code}`);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS - Allow all origins in development
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Set global prefix for all routes
  app.setGlobalPrefix("api");

  const port = process.env.PORT || 5000;

  try {
    // Listen on all network interfaces (0.0.0.0) to accept connections from mobile devices
    console.log("🔄 Attempting to start server on port", port);
    const server = await app.listen(port, "0.0.0.0");
    console.log("✅ Server listen() completed");
    console.log("🔍 Server type:", typeof server);
    console.log("🔍 Server listening:", server.listening);
    console.log(`🚀 Application is running on: http://localhost:${port}/api`);
    console.log(`📱 Mobile access: http://10.162.133.229:${port}/api`);

    // Ensure the process stays alive
    process.on("SIGTERM", () => {
      console.log("SIGTERM signal received: closing HTTP server");
      server.close(() => {
        console.log("HTTP server closed");
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error("❌ Bootstrap failed:", error);
  process.exit(1);
});
