-- LinkedIn Accelerator Seed Data
-- Initial data for testing and development
-- Run this after schema.sql

-- =====================================================
-- SEED TOOLS (TC3D) - Global Reference Data
-- =====================================================
INSERT INTO tool (tool_name, category, official_url) VALUES
-- Languages
('TypeScript', 'language', 'https://www.typescriptlang.org'),
('JavaScript', 'language', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'),
('Python', 'language', 'https://www.python.org'),
('Go', 'language', 'https://go.dev'),
('Rust', 'language', 'https://www.rust-lang.org'),
('Java', 'language', 'https://www.java.com'),

-- Frameworks
('Next.js', 'framework', 'https://nextjs.org'),
('React', 'framework', 'https://react.dev'),
('Vue.js', 'framework', 'https://vuejs.org'),
('Angular', 'framework', 'https://angular.io'),
('FastAPI', 'framework', 'https://fastapi.tiangolo.com'),
('Django', 'framework', 'https://www.djangoproject.com'),
('Express.js', 'framework', 'https://expressjs.com'),

-- Libraries
('Tailwind CSS', 'library', 'https://tailwindcss.com'),
('shadcn/ui', 'library', 'https://ui.shadcn.com'),
('Pandas', 'library', 'https://pandas.pydata.org'),
('NumPy', 'library', 'https://numpy.org'),
('TensorFlow', 'library', 'https://www.tensorflow.org'),
('PyTorch', 'library', 'https://pytorch.org'),

-- Databases
('PostgreSQL', 'database', 'https://www.postgresql.org'),
('MongoDB', 'database', 'https://www.mongodb.com'),
('Redis', 'database', 'https://redis.io'),
('MySQL', 'database', 'https://www.mysql.com'),

-- Platforms & Tools
('Docker', 'platform', 'https://www.docker.com'),
('Kubernetes', 'platform', 'https://kubernetes.io'),
('AWS', 'platform', 'https://aws.amazon.com'),
('Vercel', 'platform', 'https://vercel.com'),
('GitHub', 'tool', 'https://github.com'),
('VS Code', 'tool', 'https://code.visualstudio.com')

ON CONFLICT (tool_name) DO NOTHING;

-- =====================================================
-- SAMPLE CAPABILITIES (for testing)
-- Note: Replace 'sample-user-id' with actual Clerk user ID
-- =====================================================
-- These are commented out - add them manually with real user_id
-- INSERT INTO capability (user_id, capability_name, proficiency_level, years_experience, description) VALUES
-- ('sample-user-id', 'Full-Stack Development', 'expert', 10, 'End-to-end web application development'),
-- ('sample-user-id', 'AI/ML Engineering', 'advanced', 5, 'Machine learning model development and deployment'),
-- ('sample-user-id', 'Cloud Architecture', 'advanced', 7, 'AWS, Azure, and GCP infrastructure design'),
-- ('sample-user-id', 'DevOps', 'intermediate', 4, 'CI/CD pipelines and containerization');

COMMIT;
