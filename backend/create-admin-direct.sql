-- Check if admin user exists
SELECT * FROM "user" WHERE email = 'admin@kctmenswear.com';

-- If no user exists, you'll need to insert one
-- This is a reference - the actual password hashing needs to be done properly