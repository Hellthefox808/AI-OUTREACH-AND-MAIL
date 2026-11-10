import { defineConfig } from "vitest/config";
import path from "path";
import ts from "typescript";

function tsDecoratorMetadataPlugin() {
  return {
    name: "vite-plugin-ts-decorator-metadata",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (id.endsWith(".ts") && !id.includes("node_modules")) {
        const result = ts.transpileModule(code, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            esModuleInterop: true,
          },
          fileName: id,
        });
        return {
          code: result.outputText,
          map: result.sourceMapText,
        };
      }
    },
  };
}

export default defineConfig({
  plugins: [tsDecoratorMetadataPlugin()],
  test: {
    include: ["tests/e2e/**/*.e2e.spec.ts"],
    environment: "node",
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "reflect-metadata": path.resolve(__dirname, "../../apps/be/node_modules/reflect-metadata"),
      "@career-intelligence/shared": path.resolve(__dirname, "../../packages/shared/src"),
      "@career-intelligence/database": path.resolve(__dirname, "./harness/database-mock.ts"),
      speakeasy: path.resolve(__dirname, "../../apps/be/node_modules/speakeasy"),
      bcryptjs: path.resolve(__dirname, "../../apps/be/node_modules/bcryptjs"),
      qrcode: path.resolve(__dirname, "../../apps/be/node_modules/qrcode"),
      "cookie-parser": path.resolve(__dirname, "../../apps/be/node_modules/cookie-parser"),
      "@nestjs/common": path.resolve(__dirname, "../../apps/be/node_modules/@nestjs/common"),
      "@nestjs/core": path.resolve(__dirname, "../../apps/be/node_modules/@nestjs/core"),
      "@nestjs/jwt": path.resolve(__dirname, "../../apps/be/node_modules/@nestjs/jwt"),
      "@nestjs/config": path.resolve(__dirname, "../../apps/be/node_modules/@nestjs/config"),
      "@nestjs/swagger": path.resolve(__dirname, "../../apps/be/node_modules/@nestjs/swagger"),
      "@nestjs/testing": path.resolve(__dirname, "../../apps/be/node_modules/@nestjs/testing"),
      "class-validator": path.resolve(__dirname, "../../apps/be/node_modules/class-validator"),
      "class-transformer": path.resolve(__dirname, "../../apps/be/node_modules/class-transformer"),
      express: path.resolve(__dirname, "./harness/express-shim.ts"),
      mongoose: path.resolve(__dirname, "../../packages/database/node_modules/mongoose"),
    },
  },
});
