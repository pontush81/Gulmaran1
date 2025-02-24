-- Add new columns to guest_apartment_bookings
ALTER TABLE guest_apartment_bookings
ADD COLUMN IF NOT EXISTS guest_name text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS guest_count integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS total_price decimal(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('card', 'bank_transfer'));

-- Remove defaults after adding columns
ALTER TABLE guest_apartment_bookings
ALTER COLUMN guest_name DROP DEFAULT,
ALTER COLUMN guest_count DROP DEFAULT,
ALTER COLUMN total_price DROP DEFAULT,
ALTER COLUMN payment_status DROP DEFAULT;

-- Add check constraints
ALTER TABLE guest_apartment_bookings
ADD CONSTRAINT guest_count_check CHECK (guest_count > 0 AND guest_count <= 4),
ADD CONSTRAINT total_price_check CHECK (total_price >= 0);

-- Create function to calculate total price
CREATE OR REPLACE FUNCTION calculate_booking_price(
  p_start_date date,
  p_end_date date,
  p_guest_count integer
)
RETURNS decimal(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_nights integer;
  v_base_price decimal(10,2) := 500.00; -- Baspris per natt
  v_guest_fee decimal(10,2) := 100.00;  -- Extra avgift per gäst utöver första gästen
BEGIN
  -- Beräkna antal nätter
  v_nights := p_end_date - p_start_date;
  
  -- Beräkna totalpris
  -- Baspris * antal nätter + extra gästavgift * (antal gäster - 1) * antal nätter
  RETURN (v_base_price * v_nights) + (v_guest_fee * (p_guest_count - 1) * v_nights);
END;
$$;

-- Create trigger to automatically calculate price
CREATE OR REPLACE FUNCTION update_booking_price()
RETURNS trigger AS $$
BEGIN
  NEW.total_price := calculate_booking_price(NEW.start_date, NEW.end_date, NEW.guest_count);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_booking_price_trigger
  BEFORE INSERT OR UPDATE OF start_date, end_date, guest_count ON guest_apartment_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_price();