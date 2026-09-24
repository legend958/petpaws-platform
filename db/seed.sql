-- ============================================================
-- SEED DATA for PetPaws Platform
-- Inserts reference each other by unique lookups (e.g. email,
-- category name) so we never hardcode IDs by hand.
-- ============================================================

-- Sample admin, groomer, and customer users -------------------
INSERT INTO users (name, email, role, is_guest) VALUES
  ('Alex Admin', 'admin@petpaws.com', 'admin', FALSE),
  ('Grace Groomer', 'groomer@petpaws.com', 'groomer', FALSE),
  ('Carla Customer', 'customer@petpaws.com', 'customer', FALSE);

-- Common breeds, as pets owned by the sample customer ---------
INSERT INTO pets (user_id, name, species, breed)
SELECT id, 'Bella', 'Dog', 'Golden Retriever' FROM users WHERE email = 'customer@petpaws.com';

INSERT INTO pets (user_id, name, species, breed)
SELECT id, 'Whiskers', 'Cat', 'Maine Coon' FROM users WHERE email = 'customer@petpaws.com';

INSERT INTO pets (user_id, name, species, breed)
SELECT id, 'Kiwi', 'Bird', 'Cockatiel' FROM users WHERE email = 'customer@petpaws.com';

INSERT INTO pets (user_id, name, species, breed)
SELECT id, 'Spike', 'Reptile', 'Bearded Dragon' FROM users WHERE email = 'customer@petpaws.com';

-- Service categories -------------------------------------------
INSERT INTO categories (name) VALUES
  ('Dogs'), ('Cats'), ('Birds'), ('Reptiles');

-- Grooming services, one per category --------------------------
INSERT INTO services (category_id, title, description, base_price, location_type)
SELECT id, 'Full Grooming', 'Wash, dry, brush, paw trim and a soft coat finish', 60.00, 'Office' FROM categories WHERE name = 'Dogs';

INSERT INTO services (category_id, title, description, base_price, location_type)
SELECT id, 'Nail Trim', 'Quick, stress-free nail clipping for small to large dogs', 25.00, 'User Location' FROM categories WHERE name = 'Dogs';

INSERT INTO services (category_id, title, description, base_price, location_type)
SELECT id, 'Cat Grooming', 'Gentle de-shedding bath and brush for cats', 45.00, 'Office' FROM categories WHERE name = 'Cats';

INSERT INTO services (category_id, title, description, base_price, location_type)
SELECT id, 'Bird Bath & Wing Care', 'Fresh water bath, nail and wing check for birds', 30.00, 'Office' FROM categories WHERE name = 'Birds';

INSERT INTO services (category_id, title, description, base_price, location_type)
SELECT id, 'Reptile Habitat Refresh', 'Deep clean and safe re-setup of terrariums', 35.00, 'User Location' FROM categories WHERE name = 'Reptiles';

-- Pet products --------------------------------------------------
INSERT INTO products (title, price, delivery_mode, stock_quantity) VALUES
  ('Premium Dog Food 5kg', 59.99, 'Home Delivery', 40),
  ('Organic Cat Shampoo', 12.50, 'Store Pickup', 120),
  ('Deluxe Grooming Kit', 34.99, 'Home Delivery', 25),
  ('Sunflower Bird Seed Mix', 9.99, 'Store Pickup', 80);

-- Groomer sessions ----------------------------------------------
-- Two Full Grooming slots...
INSERT INTO groomer_sessions (groomer_id, service_id, available_time, discounted_price, is_free_session, status)
SELECT g.id, s.id, NOW() + INTERVAL '1 day' + INTERVAL '10 hours', 50.00, FALSE, 'Available'
FROM users g, services s
WHERE g.email = 'groomer@petpaws.com' AND s.title = 'Full Grooming';

INSERT INTO groomer_sessions (groomer_id, service_id, available_time, discounted_price, is_free_session, status)
SELECT g.id, s.id, NOW() + INTERVAL '1 day' + INTERVAL '15 hours', 50.00, FALSE, 'Available'
FROM users g, services s
WHERE g.email = 'groomer@petpaws.com' AND s.title = 'Full Grooming';

-- One Cat Grooming slot (paid)...
INSERT INTO groomer_sessions (groomer_id, service_id, available_time, discounted_price, is_free_session, status)
SELECT g.id, s.id, NOW() + INTERVAL '2 days' + INTERVAL '12 hours', 40.00, FALSE, 'Available'
FROM users g, services s
WHERE g.email = 'groomer@petpaws.com' AND s.title = 'Cat Grooming';

-- One FREE Cat Grooming slot, visible ONLY to registered users...
INSERT INTO groomer_sessions (groomer_id, service_id, available_time, discounted_price, is_free_session, status)
SELECT g.id, s.id, NOW() + INTERVAL '3 days' + INTERVAL '14 hours', 0.00, TRUE, 'Available'
FROM users g, services s
WHERE g.email = 'groomer@petpaws.com' AND s.title = 'Cat Grooming';

-- One Reptile Habitat Refresh slot...
INSERT INTO groomer_sessions (groomer_id, service_id, available_time, discounted_price, is_free_session, status)
SELECT g.id, s.id, NOW() + INTERVAL '4 days' + INTERVAL '11 hours', 30.00, FALSE, 'Available'
FROM users g, services s
WHERE g.email = 'groomer@petpaws.com' AND s.title = 'Reptile Habitat Refresh';