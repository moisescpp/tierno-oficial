import { type NextRequest, NextResponse } from "next/server"

// Simulamos una base de datos en memoria (en producción usarías una base de datos real)
let orders: any[] = []

export async function GET() {
  try {
    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Error getting orders:", error)
    return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { order } = await request.json()

    if (!order) {
      return NextResponse.json({ error: "Pedido requerido" }, { status: 400 })
    }

    // Buscar si el pedido ya existe
    const existingIndex = orders.findIndex((o) => o.id === order.id)

    if (existingIndex >= 0) {
      // Actualizar pedido existente
      orders[existingIndex] = order
    } else {
      // Agregar nuevo pedido
      orders.push(order)
    }

    // Ordenar por fecha de creación (más recientes primero)
    orders.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())

    return NextResponse.json({ orders })
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

    // Filtrar el pedido a eliminar
    orders = orders.filter((order) => order.id !== orderId)

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Error al eliminar pedido" }, { status: 500 })
  }
}
