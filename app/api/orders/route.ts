import { type NextRequest, NextResponse } from "next/server"

// Base de datos en memoria simple
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

    const existingIndex = orders.findIndex((o) => o.id === order.id)

    if (existingIndex >= 0) {
      orders[existingIndex] = order
    } else {
      orders.push(order)
    }

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

    orders = orders.filter((order) => order.id !== orderId)

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Error al eliminar pedido" }, { status: 500 })
  }
}
