import { createClient } from "@supabase/supabase-js"

// Estas variables las configurarás con tus credenciales de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para TypeScript
export interface DatabaseOrder {
  id: string
  customer_name: string
  address: string
  delivery_time: string
  time_format: "AM" | "PM"
  delivery_date: string
  products: any[]
  payment_method?: "transferencia" | "efectivo"
  is_delivered: boolean
  route_order: number
  phone?: string
  notes?: string
  total_amount: number
  created_at: string
  updated_at: string
}

// Función para convertir de formato de la app a formato de base de datos
export const toDatabase = (order: any): Omit<DatabaseOrder, "created_at" | "updated_at"> => ({
  id: order.id,
  customer_name: order.customerName,
  address: order.address,
  delivery_time: order.deliveryTime,
  time_format: order.timeFormat,
  delivery_date: order.deliveryDate,
  products: order.products,
  payment_method: order.paymentMethod,
  is_delivered: order.isDelivered,
  route_order: order.routeOrder,
  phone: order.phone,
  notes: order.notes,
  total_amount: order.totalAmount,
})

// Función para convertir de formato de base de datos a formato de la app
export const fromDatabase = (dbOrder: DatabaseOrder): any => ({
  id: dbOrder.id,
  customerName: dbOrder.customer_name,
  address: dbOrder.address,
  deliveryTime: dbOrder.delivery_time,
  timeFormat: dbOrder.time_format,
  deliveryDate: dbOrder.delivery_date,
  products: dbOrder.products,
  paymentMethod: dbOrder.payment_method,
  isDelivered: dbOrder.is_delivered,
  routeOrder: dbOrder.route_order,
  phone: dbOrder.phone,
  notes: dbOrder.notes,
  totalAmount: dbOrder.total_amount,
  createdAt: dbOrder.created_at,
  updatedAt: dbOrder.updated_at,
})
