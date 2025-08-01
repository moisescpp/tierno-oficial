import { type NextRequest, NextResponse } from "next/server"
import { supabase, toDatabase, fromDatabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Intentar obtener datos de Supabase
    const { data: supabaseOrders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      // Fallback a localStorage si Supabase falla
      return NextResponse.json({
        orders: [],
        source: "fallback",
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
      })
    }

    // Convertir formato de base de datos a formato de la app
    const orders = supabaseOrders.map(fromDatabase)

    return NextResponse.json({
      orders,
      source: "supabase",
      timestamp: new Date().toISOString(),
      total: orders.length,
    })
  } catch (error) {
    console.error("Error getting orders:", error)
    return NextResponse.json(
      {
        error: "Error al obtener pedidos",
        orders: [],
        source: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { order } = await request.json()

    if (!order || !order.id) {
      return NextResponse.json({ error: "Pedido con ID requerido" }, { status: 400 })
    }

    // Convertir a formato de base de datos
    const dbOrder = toDatabase(order)

    // Intentar guardar en Supabase
    const { data, error } = await supabase
      .from("orders")
      .upsert(dbOrder, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error("Supabase save error:", error)
      return NextResponse.json({ error: "Error al guardar en base de datos" }, { status: 500 })
    }

    // Obtener todos los pedidos actualizados
    const { data: allOrders, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError)
      return NextResponse.json({ error: "Error al obtener pedidos actualizados" }, { status: 500 })
    }

    const orders = allOrders.map(fromDatabase)

    return NextResponse.json({
      orders,
      message: "Pedido guardado exitosamente",
      source: "supabase",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error saving order:", error)
    return NextResponse.json({ error: "Error al guardar pedido" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "ID de pedido requerido" }, { status: 400 })
    }

    // Eliminar de Supabase
    const { error } = await supabase.from("orders").delete().eq("id", orderId)

    if (error) {
      console.error("Supabase delete error:", error)
      return NextResponse.json({ error: "Error al eliminar de base de datos" }, { status: 500 })
    }

    // Obtener todos los pedidos actualizados
    const { data: allOrders, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError)
      return NextResponse.json({ error: "Error al obtener pedidos actualizados" }, { status: 500 })
    }

    const orders = allOrders.map(fromDatabase)

    return NextResponse.json({
      orders,
      message: "Pedido eliminado exitosamente",
      source: "supabase",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Error al eliminar pedido" }, { status: 500 })
  }
}
