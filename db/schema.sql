CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer', -- customer, groomer, admin
  is_guest BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  species TEXT NOT NULL, -- Dog, Cat, Bird, Reptile
  breed TEXT NOT NULL
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL -- Dogs, Cats, Birds, Reptiles
);

CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL, -- e.g., Full Grooming, Nail Trim
  description TEXT NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL,
  location_type TEXT NOT NULL -- Office or User Location
);

CREATE TABLE groomer_sessions (
  id SERIAL PRIMARY KEY,
  groomer_id INTEGER NOT NULL REFERENCES users(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  available_time TIMESTAMPTZ NOT NULL,
  discounted_price NUMERIC(10, 2) NOT NULL,
  is_free_session BOOLEAN NOT NULL DEFAULT FALSE, -- visible only to registered users
  status TEXT NOT NULL DEFAULT 'Available' -- Available, Booked
);

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  session_id INTEGER NOT NULL REFERENCES groomer_sessions(id),
  pet_id INTEGER NOT NULL REFERENCES pets(id),
  status TEXT NOT NULL DEFAULT 'Confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL, -- e.g., Premium Dog Food, Organic Cat Shampoo
  price NUMERIC(10, 2) NOT NULL,
  delivery_mode TEXT NOT NULL, -- Home Delivery, Store Pickup
  stock_quantity INTEGER NOT NULL
);

CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  item_type TEXT NOT NULL, -- 'service' or 'product'
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Paid', -- Simulated gateway status
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE analytics_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'page_visit', 'guest_view', 'registration'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);