-- ============================================================
-- DOKON — Full Database Schema
-- Run this entire file once in Supabase SQL Editor
-- ============================================================

-- ----------------------------
-- 1. couriers
-- ----------------------------
CREATE TABLE IF NOT EXISTS couriers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text NOT NULL,
  passport_no text NOT NULL,
  phone       text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Enable Row Level Security (anon key can read/write)
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON couriers FOR ALL TO anon USING (true) WITH CHECK (true);

-- ----------------------------
-- 2. scooters
-- ----------------------------
CREATE TABLE IF NOT EXISTS scooters (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model      text NOT NULL,
  vin        text NOT NULL UNIQUE,
  plate      text NOT NULL UNIQUE,
  status     text NOT NULL DEFAULT 'available'
               CHECK (status IN ('available', 'rented', 'maintenance')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scooters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON scooters FOR ALL TO anon USING (true) WITH CHECK (true);

-- ----------------------------
-- 3. rentals
-- ----------------------------
CREATE TABLE IF NOT EXISTS rentals (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_no       text NOT NULL UNIQUE,
  courier_id         uuid REFERENCES couriers(id),
  scooter_id         uuid REFERENCES scooters(id),
  tariff             text NOT NULL CHECK (tariff IN ('daily', 'weekly', 'monthly')),
  start_date         date NOT NULL,
  end_date           date NOT NULL,
  status             text NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'completed', 'cancelled')),
  license_no         text NOT NULL,
  license_issue_date date NOT NULL,
  photos             text[] DEFAULT '{}',
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON rentals FOR ALL TO anon USING (true) WITH CHECK (true);

-- ----------------------------
-- 4. payments
-- ----------------------------
CREATE TABLE IF NOT EXISTS payments (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid REFERENCES rentals(id),
  amount    numeric NOT NULL,
  method    text NOT NULL CHECK (method IN ('cash', 'transfer')),
  paid_at   date NOT NULL,
  note      text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON payments FOR ALL TO anon USING (true) WITH CHECK (true);

-- ----------------------------
-- 5. Trigger: sync scooter status with rental status
-- ----------------------------
CREATE OR REPLACE FUNCTION update_scooter_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE scooters SET status = 'rented' WHERE id = NEW.scooter_id;
  ELSIF NEW.status IN ('completed', 'cancelled') THEN
    UPDATE scooters SET status = 'available' WHERE id = NEW.scooter_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS rental_status_trigger ON rentals;
CREATE TRIGGER rental_status_trigger
  AFTER INSERT OR UPDATE ON rentals
  FOR EACH ROW EXECUTE FUNCTION update_scooter_status();
