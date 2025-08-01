-- Script para crear la tabla en Supabase
-- Ejecutar en el SQL Editor de Supabase

-- Crear tabla para los pedidos
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  address TEXT NOT NULL,
  delivery_time TEXT NOT NULL,
  time_format TEXT NOT NULL CHECK (time_format IN ('AM', 'PM')),
  delivery_date DATE NOT NULL,
  products JSONB NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('transferencia', 'efectivo')),
  is_delivered BOOLEAN DEFAULT FALSE,
  route_order INTEGER NOT NULL DEFAULT 1,
  phone TEXT,
  notes TEXT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_route_order ON orders(delivery_date, route_order);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS) - Opcional para mayor seguridad
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (para desarrollo)
-- En producción podrías restringir por usuario
CREATE POLICY "Allow all operations on orders" ON orders
    FOR ALL USING (true);
