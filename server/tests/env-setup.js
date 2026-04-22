// Runs BEFORE any module is required — sets test DB and JWT secret
process.env.DATABASE_URL = 'postgresql://postgres:Bazez@localhost:5432/dashboard_restaurante_test';
process.env.JWT_SECRET   = 'test-secret-key-for-jest-2026';
process.env.JWT_EXPIRES  = '1h';
process.env.PORT         = '9001';
