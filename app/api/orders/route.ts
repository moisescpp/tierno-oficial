import { type NextRequest, NextResponse } from "next/server"

// Base de datos en memoria mejorada con persistencia
let orders: any[] = []
let isInitialized = false

// Función para inicializar datos desde localStorage simulado
const initializeData = () => {
  if (!isInitialized) {
    // En un entorno real, aquí cargarías desde una base de datos
    // Por ahora mantenemos los datos en memoria durante la sesión del servidor
    isInitialized = true
  }
}

export async function GET() {
  try {
    initializeData()

    // Devolver todos los pedidos ordenados por fecha de creación (más recientes primero)
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt || "").getTime()
      const dateB = new Date(b.createdAt || "").getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      orders: sortedOrders,
      timestamp: new Date().toISOString(),
      total: sortedOrders.length,
    })
  } catch (error) {
    console.error("Error getting orders:", error)
    return NextResponse.json(
      {
        error: "Error al obtener pedidos",
        orders: [],
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeData()

    const { order } = await request.json()

    if (!order || !order.id) {
      return NextResponse.json(
        {
          error: "Pedido con ID requerido",
          orders: orders,
        },
        { status: 400 },
      )
    }

    // Buscar si el pedido ya existe
    const existingIndex = orders.findIndex((o) => o.id === order.id)
    const now = new Date().toISOString()

    if (existingIndex >= 0) {
      // Actualizar pedido existente manteniendo la fecha de creación original
      orders[existingIndex] = {
        ...order,
        updatedAt: now,
        createdAt: orders[existingIndex].createdAt || now,
      }
    } else {
      // Agregar nuevo pedido
      orders.push({
        ...order,
        createdAt: order.createdAt || now,
        updatedAt: now,
      })
    }

    // Devolver todos los pedidos ordenados
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt || "").getTime()
      const dateB = new Date(b.createdAt || "").getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      orders: sortedOrders,
      message: existingIndex >= 0 ? "Pedido actualizado" : "Pedido creado",
      timestamp: now,
    })
  } catch (error) {
    console.error("Error saving order:", error)
    return NextResponse.json(
      {
        error: "Error al guardar pedido",
        orders: orders,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeData()

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        {
          error: "ID de pedido requerido",
          orders: orders,
        },
        { status: 400 },
      )
    }

    // Filtrar el pedido a eliminar
    const initialLength = orders.length
    orders = orders.filter((order) => order.id !== orderId)

    const wasDeleted = orders.length < initialLength

    // Devolver todos los pedidos restantes ordenados
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt || "").getTime()
      const dateB = new Date(b.createdAt || "").getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      orders: sortedOrders,
      message: wasDeleted ? "Pedido eliminado" : "Pedido no encontrado",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json(
      {
        error: "Error al eliminar pedido",
        orders: orders,
      },
      { status: 500 },
    )
  }
}
