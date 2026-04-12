import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
   // Evitar conflitos com o db real
   process.env.NODE_ENV = "test";
   process.env.JWT_SECRET = "test-secret-key-123456789";
   process.env.JWT_EXPIRES_IN = "15m";
   process.env.JWT_REFRESH_SECRET = "test-refresh-secret-123456789";
   process.env.JWT_REFRESH_EXPIRES_IN = "7d";

   mongoServer = await MongoMemoryServer.create();
   const mongoUri = mongoServer.getUri();

   if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
   }

   await mongoose.connect(mongoUri);
});

afterAll(async () => {
   await mongoose.disconnect();
   if (mongoServer) {
      await mongoServer.stop();
   }
});

afterEach(async () => {
   const collections = mongoose.connection.collections;
   for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
   }
});
