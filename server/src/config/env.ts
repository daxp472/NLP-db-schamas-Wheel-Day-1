import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/schema_studio',
  MONGODB_DATABASE: process.env.MONGODB_DATABASE || 'schema_studio',
  JWT_SECRET: process.env.JWT_SECRET || 'schema-studio-secret-jwt-key-development-min-32-chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  
  // Optional SMTP configuration for live email dispatch
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'Schema Studio AI <noreply@schemastudio.local>',
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
};

export function validateEnv(): void {
  const errors: string[] = [];

  if (isNaN(ENV.PORT) || ENV.PORT <= 0 || ENV.PORT > 65535) {
    errors.push(`Invalid PORT: "${process.env.PORT}". Expected integer between 1 and 65535.`);
  }

  if (!['development', 'production', 'test'].includes(ENV.NODE_ENV)) {
    errors.push(`Invalid NODE_ENV: "${ENV.NODE_ENV}". Allowed: development, production, test.`);
  }

  if (!ENV.MONGODB_URI.startsWith('mongodb://') && !ENV.MONGODB_URI.startsWith('mongodb+srv://')) {
    errors.push(`Invalid MONGODB_URI: Must start with "mongodb://" or "mongodb+srv://".`);
  }

  if (ENV.NODE_ENV === 'production') {
    if (!ENV.JWT_SECRET || ENV.JWT_SECRET.length < 32) {
      errors.push(`Production security error: JWT_SECRET must be at least 32 characters long.`);
    }
    if (ENV.JWT_SECRET === 'schema-studio-secret-jwt-key-development-min-32-chars') {
      errors.push(`Production security error: Default development JWT_SECRET is not allowed in production.`);
    }
  }

  if (errors.length > 0) {
    console.error('================================================================================');
    console.error('FATAL: Environment Configuration Error');
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error('Please check your .env configuration file.');
    console.error('================================================================================');
    throw new Error(`Environment validation failed: ${errors.join('; ')}`);
  }
}
