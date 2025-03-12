import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Authentication API Documentation",
      version: "1.0.0",
      description:
        "Modern authentication system with Express.js and TypeScript",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "API Support",
        url: "https://github.com/yourusername/auth-next-rn-express",
        email: "your.email@example.com",
      },
    },
    servers: [
      {
        url: "http://localhost:8000/api/v1",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/**/*.ts"], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
