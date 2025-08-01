import { type NextRequest, NextResponse } from "next/server"

// Base de datos en memoria simple
let orders: any[] = []

export async function GET() {
  try {
    // Devolver todos los pedidos ordenados por fecha de creación
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json({ orders: sortedOrders })
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
      orders[existingIndex] = { ...order, updatedAt: new Date().toISOString() }
    } else {
      // Agregar nuevo pedido
      orders.push({ ...order, createdAt: order.createdAt || new Date().toISOString() })
    }

    // Devolver todos los pedidos ordenados
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json({ orders: sortedOrders })
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

    // Devolver todos los pedidos restantes ordenados
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json({ orders: sortedOrders })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Error al eliminar pedido" }, { status: 500 })
  }
}
