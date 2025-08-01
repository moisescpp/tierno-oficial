"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  MapPin,
  Clock,
  User,
  DollarSign,
  Check,
  Edit3,
  GripVertical,
  Route,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Package,
  Github,
  Instagram,
  Facebook,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Product {
  name: string
  quantity: number
  unit: string
  price: number
  total: number
}

interface Order {
  id: string
  customerName: string
  address: string
  deliveryTime: string
  timeFormat: "AM" | "PM"
  deliveryDate: string
  products: Product[]
  paymentMethod?: "transferencia" | "efectivo"
  isDelivered: boolean
  routeOrder: number
  phone?: string
  notes?: string
  totalAmount: number
  createdAt: string
  updatedAt?: string
}

// PRECIOS ACTUALIZADOS
const PRODUCTS = [
  { name: "Arepas de maíz", units: ["unidades"], price: 8000 },
  { name: "Kilos de masa de maíz", units: ["kilos"], price: 8000 },
  { name: "Queso tipo paisa", units: ["kilo", "libra"], price: { kilo: 25000, libra: 13000 } },
  { name: "Queso semiduro", units: ["kilo", "libra"], price: { kilo: 25000, libra: 13000 } },
  { name: "Requesón", units: ["unidades"], price: 12000 },
  { name: "Limones", units: ["unidades"], price: 6000 },
  { name: "Chorizos", units: ["unidades"], price: 23000 },
  { name: "Mora", units: ["unidades"], price: 6500 },
]

const DAYS_OF_WEEK = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

// Función para obtener el inicio de la semana (lunes)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

// Función para formatear la semana
const formatWeek = (weekStart: Date): string => {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const startDay = weekStart.getDate()
  const endDay = weekEnd.getDate()
  const month = weekStart.toLocaleDateString("es-CO", { month: "short" })

  return `${startDay} - ${endDay} ${month}`
}

// Función para obtener la clave de la semana
const getWeekKey = (date: string): string => {
  const d = new Date(date + "T00:00:00")
  const weekStart = getWeekStart(d)
  return weekStart.toISOString().split("T")[0]
}

export default function ArepaDeliveryManager() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string>("")
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null)
  const [routeOrders, setRouteOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<number>(0)

  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    customerName: "",
    address: "",
    deliveryTime: "",
    timeFormat: "AM",
    deliveryDate: "",
    products: [],
    phone: "",
    notes: "",
    totalAmount: 0,
  })

  // Cargar datos iniciales
  useEffect(() => {
    loadOrders()
  }, [])

  // Sincronización automática optimizada (solo cada 30 segundos y cuando no hay actividad)
  useEffect(() => {
    const interval = setInterval(() => {
      // Solo sincronizar si no hay modales abiertos, no se está guardando, y han pasado al menos 30 segundos
      const now = Date.now()
      if (!isDialogOpen && !isRouteDialogOpen && !saving && now - lastSyncTime > 30000) {
        loadOrders(true) // Carga silenciosa
      }
    }, 30000) // Cada 30 segundos en lugar de 5

    return () => clearInterval(interval)
  }, [isDialogOpen, isRouteDialogOpen, saving, lastSyncTime])

  const loadOrders = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true)

        const response = await fetch("/api/orders", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (response.ok) {
          const data = await response.json()
          const loadedOrders = data.orders || []

          // Solo actualizar si hay cambios reales para evitar re-renders innecesarios
          setOrders((currentOrders) => {
            const ordersChanged = JSON.stringify(loadedOrders) !== JSON.stringify(currentOrders)
            if (ordersChanged) {
              // Backup en localStorage
              localStorage.setItem("arepa-orders", JSON.stringify(loadedOrders))
              return loadedOrders
            }
            return currentOrders
          })

          setIsConnected(true)
          setLastSyncTime(Date.now())
        } else {
          throw new Error("Error de servidor")
        }
      } catch (err) {
        console.error("Error loading orders:", err)
        // Usar localStorage como backup solo si no hay datos o es la primera carga
        if (orders.length === 0 || !silent) {
          const savedOrders = localStorage.getItem("arepa-orders")
          if (savedOrders) {
            try {
              const parsedOrders = JSON.parse(savedOrders)
              setOrders(parsedOrders)
            } catch (parseError) {
              console.error("Error parsing saved orders:", parseError)
            }
          }
        }
        setIsConnected(false)
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [orders.length],
  )

  const saveOrder = useCallback(async (order: Order) => {
    try {
      setSaving(true)

      // Actualizar inmediatamente en el estado local para mejor UX
      setOrders((prevOrders) => {
        const filteredOrders = prevOrders.filter((o) => o.id !== order.id)
        const updatedOrders = [...filteredOrders, { ...order, updatedAt: new Date().toISOString() }].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        // Backup inmediato en localStorage
        localStorage.setItem("arepa-orders", JSON.stringify(updatedOrders))
        return updatedOrders
      })

      // Intentar guardar en el servidor
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: { ...order, updatedAt: new Date().toISOString() } }),
      })

      if (response.ok) {
        const data = await response.json()
        const serverOrders = data.orders || []
        setOrders(serverOrders)
        setIsConnected(true)
        localStorage.setItem("arepa-orders", JSON.stringify(serverOrders))
        setLastSyncTime(Date.now())
      } else {
        throw new Error("Error al guardar en servidor")
      }
    } catch (err) {
      console.error("Error saving order:", err)
      setIsConnected(false)
      // Los datos ya están guardados localmente, así que no se pierden
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteOrder = useCallback(async (orderId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este pedido?")) return

    try {
      setSaving(true)

      // Actualizar inmediatamente en el estado local
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.filter((order) => order.id !== orderId)
        localStorage.setItem("arepa-orders", JSON.stringify(updatedOrders))
        return updatedOrders
      })

      // Intentar eliminar en el servidor
      const response = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      if (response.ok) {
        const data = await response.json()
        const serverOrders = data.orders || []
        setOrders(serverOrders)
        localStorage.setItem("arepa-orders", JSON.stringify(serverOrders))
        setLastSyncTime(Date.now())
      }
    } catch (err) {
      console.error("Error deleting order:", err)
      setIsConnected(false)
    } finally {
      setSaving(false)
    }
  }, [])

  // Calcular total del pedido
  useEffect(() => {
    const total = newOrder.products?.reduce((sum, product) => sum + product.total, 0) || 0
    setNewOrder((prev) => ({ ...prev, totalAmount: total }))
  }, [newOrder.products])

  const getProductPrice = useCallback((productName: string, unit: string): number => {
    const product = PRODUCTS.find((p) => p.name === productName)
    if (!product) return 0

    if (typeof product.price === "object") {
      return product.price[unit as keyof typeof product.price] || 0
    }
    return product.price as number
  }, [])

  const addProduct = useCallback(() => {
    setNewOrder((prev) => ({
      ...prev,
      products: [...(prev.products || []), { name: "", quantity: 1, unit: "unidades", price: 0, total: 0 }],
    }))
  }, [])

  const updateProduct = useCallback(
    (index: number, field: keyof Product, value: string | number) => {
      setNewOrder((prev) => {
        const updatedProducts = [...(prev.products || [])]

        if (updatedProducts[index]) {
          const updatedProduct = { ...updatedProducts[index] }

          // Actualizar el campo específico
          if (field === "quantity") {
            updatedProduct.quantity = Math.max(1, Number(value) || 1) // Asegurar mínimo 1
          } else {
            updatedProduct[field] = value as any
          }

          // Recalcular precio y total cuando cambie el producto, unidad o cantidad
          if (field === "name" || field === "unit") {
            const price = getProductPrice(updatedProduct.name, updatedProduct.unit)
            updatedProduct.price = price
            updatedProduct.total = price * updatedProduct.quantity
          } else if (field === "quantity") {
            updatedProduct.total = updatedProduct.price * updatedProduct.quantity
          }

          updatedProducts[index] = updatedProduct
        }

        return { ...prev, products: updatedProducts }
      })
    },
    [getProductPrice],
  )

  const removeProduct = useCallback((index: number) => {
    setNewOrder((prev) => ({
      ...prev,
      products: prev.products?.filter((_, i) => i !== index) || [],
    }))
  }, [])

  const handleSaveOrder = useCallback(async () => {
    if (
      !newOrder.customerName ||
      !newOrder.address ||
      !newOrder.deliveryTime ||
      !newOrder.deliveryDate ||
      !newOrder.products?.length
    ) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    const weekOrders = getOrdersByWeek(getWeekKey(newOrder.deliveryDate!))
    const dayOrders = weekOrders.filter((order) => order.deliveryDate === newOrder.deliveryDate)
    const maxRouteOrder = Math.max(...dayOrders.map((order) => order.routeOrder), 0)

    const orderToSave: Order = {
      id: editingOrder?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerName: newOrder.customerName!,
      address: newOrder.address!,
      deliveryTime: newOrder.deliveryTime!,
      timeFormat: newOrder.timeFormat!,
      deliveryDate: newOrder.deliveryDate!,
      products: newOrder.products!,
      phone: newOrder.phone,
      notes: newOrder.notes,
      isDelivered: editingOrder?.isDelivered || false,
      paymentMethod: editingOrder?.paymentMethod,
      routeOrder: editingOrder?.routeOrder || maxRouteOrder + 1,
      totalAmount: newOrder.totalAmount!,
      createdAt: editingOrder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await saveOrder(orderToSave)
    resetForm()
    setIsDialogOpen(false)
  }, [newOrder, editingOrder, saveOrder])

  const resetForm = useCallback(() => {
    setNewOrder({
      customerName: "",
      address: "",
      deliveryTime: "",
      timeFormat: "AM",
      deliveryDate: "",
      products: [],
      phone: "",
      notes: "",
      totalAmount: 0,
    })
    setEditingOrder(null)
  }, [])

  const editOrder = useCallback((order: Order) => {
    setEditingOrder(order)
    setNewOrder({
      customerName: order.customerName,
      address: order.address,
      deliveryTime: order.deliveryTime,
      timeFormat: order.timeFormat,
      deliveryDate: order.deliveryDate,
      products: [...order.products],
      phone: order.phone,
      notes: order.notes,
      totalAmount: order.totalAmount,
    })
    setIsDialogOpen(true)
  }, [])

  const markAsDelivered = useCallback(
    async (orderId: string, paymentMethod: "transferencia" | "efectivo") => {
      const order = orders.find((o) => o.id === orderId)
      if (order) {
        // IMPORTANTE: Mantener todos los datos del pedido, solo cambiar el estado de entrega
        const updatedOrder: Order = {
          ...order, // Mantener TODOS los datos existentes
          isDelivered: true,
          paymentMethod,
          updatedAt: new Date().toISOString(),
        }
        await saveOrder(updatedOrder)
      }
    },
    [orders, saveOrder],
  )

  // Funciones para manejo de semanas
  const getOrdersByWeek = useCallback(
    (weekKey: string) => {
      return orders.filter((order) => getWeekKey(order.deliveryDate) === weekKey)
    },
    [orders],
  )

  const getOrdersByDate = useCallback(
    (date: string) => {
      return orders.filter((order) => order.deliveryDate === date).sort((a, b) => a.routeOrder - b.routeOrder)
    },
    [orders],
  )

  const getUniqueWeeks = useCallback(() => {
    const weeks = [...new Set(orders.map((order) => getWeekKey(order.deliveryDate)))].sort().reverse()
    return weeks
  }, [orders])

  const getUniqueDatesInWeek = useCallback(
    (weekKey: string) => {
      const weekOrders = getOrdersByWeek(weekKey)
      const dates = [...new Set(weekOrders.map((order) => order.deliveryDate))].sort()
      return dates
    },
    [getOrdersByWeek],
  )

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString + "T00:00:00")
    const dayName = DAYS_OF_WEEK[date.getDay()]
    const formattedDate = date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
    })
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${formattedDate}`
  }, [])

  const getTotalsByWeek = useCallback(
    (weekKey: string) => {
      const weekOrders = getOrdersByWeek(weekKey)
      const total = weekOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      const delivered = weekOrders
        .filter((order) => order.isDelivered)
        .reduce((sum, order) => sum + order.totalAmount, 0)
      return {
        total,
        delivered,
        pending: total - delivered,
        totalOrders: weekOrders.length,
        deliveredOrders: weekOrders.filter((order) => order.isDelivered).length,
      }
    },
    [getOrdersByWeek],
  )

  const getTotalsByDate = useCallback(
    (date: string) => {
      const dayOrders = getOrdersByDate(date)
      const total = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      const delivered = dayOrders
        .filter((order) => order.isDelivered)
        .reduce((sum, order) => sum + order.totalAmount, 0)
      return { total, delivered, pending: total - delivered }
    },
    [getOrdersByDate],
  )

  // Drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, orderId: string) => {
    setDraggedOrder(orderId)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetOrderId: string, date: string) => {
      e.preventDefault()

      if (!draggedOrder || draggedOrder === targetOrderId) {
        setDraggedOrder(null)
        return
      }

      const dayOrders = getOrdersByDate(date)
      const draggedIndex = dayOrders.findIndex((order) => order.id === draggedOrder)
      const targetIndex = dayOrders.findIndex((order) => order.id === targetOrderId)

      if (draggedIndex === -1 || targetIndex === -1) return

      const newOrders = [...dayOrders]
      const [draggedItem] = newOrders.splice(draggedIndex, 1)
      newOrders.splice(targetIndex, 0, draggedItem)

      // Actualizar el orden de ruta para todos los pedidos del día
      for (let i = 0; i < newOrders.length; i++) {
        const updatedOrder = { ...newOrders[i], routeOrder: i + 1, updatedAt: new Date().toISOString() }
        await saveOrder(updatedOrder)
      }

      setDraggedOrder(null)
    },
    [draggedOrder, getOrdersByDate, saveOrder],
  )

  // Organizador de rutas
  const openRouteOrganizer = useCallback(
    (date: string) => {
      const dayOrders = getOrdersByDate(date)
      setRouteOrders([...dayOrders])
      setIsRouteDialogOpen(true)
    },
    [getOrdersByDate],
  )

  const moveOrderInRoute = useCallback((fromIndex: number, toIndex: number) => {
    setRouteOrders((prevRouteOrders) => {
      const newRouteOrders = [...prevRouteOrders]
      const [movedOrder] = newRouteOrders.splice(fromIndex, 1)
      newRouteOrders.splice(toIndex, 0, movedOrder)
      return newRouteOrders
    })
  }, [])

  const saveRouteOrder = useCallback(async () => {
    setSaving(true)
    for (let i = 0; i < routeOrders.length; i++) {
      const updatedOrder = {
        ...routeOrders[i],
        routeOrder: i + 1,
        updatedAt: new Date().toISOString(),
      }
      await saveOrder(updatedOrder)
    }
    setSaving(false)
    setIsRouteDialogOpen(false)
  }, [routeOrders, saveOrder])

  const OrderCard = ({ order, dayOrders }: { order: Order; dayOrders: Order[] }) => {
    const orderIndex = dayOrders.findIndex((o) => o.id === order.id)

    return (
      <Card
        className={`mb-3 cursor-move transition-all duration-200 ${
          order.isDelivered ? "bg-green-50 border-green-200" : "bg-white"
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, order.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, order.id, order.deliveryDate)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <Badge variant="outline" className="text-xs font-mono">
                #{orderIndex + 1}
              </Badge>
              <CardTitle className="text-base font-semibold">{order.customerName}</CardTitle>
              {order.isDelivered && (
                <Badge className="bg-green-500 text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  Entregado
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => editOrder(order)} disabled={saving}>
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteOrder(order.id)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "×"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{order.address}</span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium">
                  {order.deliveryTime} {order.timeFormat}
                </span>
              </div>
              {order.phone && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{order.phone}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-gray-600" />
                <h4 className="font-medium text-sm">Productos:</h4>
              </div>
              <ul className="text-sm space-y-1">
                {order.products.map((product, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span className="text-gray-700">
                      • {product.quantity} {product.unit} de {product.name}
                    </span>
                    <span className="font-semibold text-green-600">${product.total.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t mt-2 pt-2 flex justify-between items-center">
                <span className="font-bold text-gray-800">Total:</span>
                <span className="font-bold text-lg text-green-600">${order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {order.notes && (
              <div className="text-sm bg-blue-50 p-2 rounded">
                <strong className="text-blue-800">Notas:</strong>
                <span className="text-blue-700 ml-1">{order.notes}</span>
              </div>
            )}

            {!order.isDelivered ? (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => markAsDelivered(order.id, "transferencia")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Transferencia
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAsDelivered(order.id, "efectivo")}
                  className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                  disabled={saving}
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Efectivo
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Pagado por {order.paymentMethod}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const uniqueWeeks = getUniqueWeeks()

  // Seleccionar la semana actual por defecto
  useEffect(() => {
    if (uniqueWeeks.length > 0 && !selectedWeek) {
      setSelectedWeek(uniqueWeeks[0])
    }
  }, [uniqueWeeks, selectedWeek])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Entregas - Arepas</h1>
            {isConnected ? (
              <CheckCircle className="w-5 h-5 text-green-500" title="Conectado" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" title="Modo local" />
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} disabled={saving} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrder ? "Editar Pedido" : "Nuevo Pedido"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 p-2">
                {/* Información del Cliente */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Información del Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName" className="text-sm font-medium">
                        Nombre del Cliente *
                      </Label>
                      <Input
                        id="customerName"
                        value={newOrder.customerName || ""}
                        onChange={(e) => setNewOrder((prev) => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Nombre completo del cliente"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Teléfono
                      </Label>
                      <Input
                        id="phone"
                        value={newOrder.phone || ""}
                        onChange={(e) => setNewOrder((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="Número de contacto"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="address" className="text-sm font-medium">
                      Dirección de Entrega *
                    </Label>
                    <Textarea
                      id="address"
                      value={newOrder.address || ""}
                      onChange={(e) => setNewOrder((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Dirección completa de entrega con referencias"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Información de Entrega */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Información de Entrega</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="deliveryDate" className="text-sm font-medium">
                        Fecha de Entrega *
                      </Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={newOrder.deliveryDate || ""}
                        onChange={(e) => setNewOrder((prev) => ({ ...prev, deliveryDate: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryTime" className="text-sm font-medium">
                        Hora *
                      </Label>
                      <Input
                        id="deliveryTime"
                        value={newOrder.deliveryTime || ""}
                        onChange={(e) => setNewOrder((prev) => ({ ...prev, deliveryTime: e.target.value }))}
                        placeholder="8:00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timeFormat" className="text-sm font-medium">
                        AM/PM
                      </Label>
                      <Select
                        value={newOrder.timeFormat}
                        onValueChange={(value: "AM" | "PM") => setNewOrder((prev) => ({ ...prev, timeFormat: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total del Pedido</Label>
                      <div className="mt-1 p-2 bg-green-100 rounded-md">
                        <div className="text-xl font-bold text-green-700">
                          ${newOrder.totalAmount?.toLocaleString() || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Productos */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Productos del Pedido *</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Producto
                    </Button>
                  </div>

                  {newOrder.products?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No hay productos agregados</p>
                      <p className="text-sm">Haz clic en "Agregar Producto" para comenzar</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {newOrder.products?.map((product, index) => (
                      <div key={index} className="bg-white p-4 border rounded-lg shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium">Producto</Label>
                            <Select value={product.name} onValueChange={(value) => updateProduct(index, "name", value)}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Seleccionar producto" />
                              </SelectTrigger>
                              <SelectContent>
                                {PRODUCTS.map((prod) => (
                                  <SelectItem key={prod.name} value={prod.name}>
                                    {prod.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Cantidad</Label>
                            <Input
                              type="number"
                              value={product.quantity}
                              onChange={(e) => {
                                const value = e.target.value
                                updateProduct(
                                  index,
                                  "quantity",
                                  value === "" ? 1 : Math.max(1, Number.parseInt(value) || 1),
                                )
                              }}
                              className="mt-1"
                              min="1"
                              step="1"
                            />
                          </div>

                          {product.name && PRODUCTS.find((p) => p.name === product.name)?.units.length! > 1 && (
                            <div>
                              <Label className="text-sm font-medium">Unidad</Label>
                              <Select
                                value={product.unit}
                                onValueChange={(value) => updateProduct(index, "unit", value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PRODUCTS.find((p) => p.name === product.name)?.units.map((unit) => (
                                    <SelectItem key={unit} value={unit}>
                                      {unit}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div>
                            <Label className="text-sm font-medium">Precio Unit.</Label>
                            <div className="mt-1 p-2 bg-gray-100 rounded text-sm font-medium">
                              ${product.price.toLocaleString()}
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Total</Label>
                            <div className="mt-1 p-2 bg-green-100 rounded text-sm font-bold text-green-700">
                              ${product.total.toLocaleString()}
                            </div>
                          </div>

                          <div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeProduct(index)}
                              className="w-full"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notas Adicionales */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Notas Adicionales</h3>
                  <Textarea
                    id="notes"
                    value={newOrder.notes || ""}
                    onChange={(e) => setNewOrder((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Instrucciones especiales, referencias adicionales, observaciones..."
                    rows={3}
                    className="w-full"
                  />
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSaveOrder} className="flex-1 h-12 text-lg" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : editingOrder ? (
                      "Actualizar Pedido"
                    ) : (
                      "Guardar Pedido"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12 px-8">
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dialog para organizar rutas */}
        <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Organizar Ruta de Entrega</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Arrastra los pedidos para cambiar el orden de entrega. El pedido #1 será el primero en entregar.
              </p>

              <div className="space-y-2">
                {routeOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", index.toString())
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const fromIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))
                      moveOrderInRoute(fromIndex, index)
                    }}
                  >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-gray-600">{order.address}</div>
                      <div className="text-sm text-gray-500">
                        {order.deliveryTime} {order.timeFormat} - ${order.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={saveRouteOrder} className="flex-1" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Orden de Ruta"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsRouteDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {uniqueWeeks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay pedidos programados</p>
              <p className="text-sm text-gray-400 mt-2">Haz clic en "Nuevo Pedido" para comenzar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Navegación de semanas mejorada */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg text-blue-900">Portafolio Semanal</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentIndex = uniqueWeeks.indexOf(selectedWeek)
                        if (currentIndex < uniqueWeeks.length - 1) {
                          setSelectedWeek(uniqueWeeks[currentIndex + 1])
                        }
                      }}
                      disabled={uniqueWeeks.indexOf(selectedWeek) >= uniqueWeeks.length - 1}
                      className="text-xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentIndex = uniqueWeeks.indexOf(selectedWeek)
                        if (currentIndex > 0) {
                          setSelectedWeek(uniqueWeeks[currentIndex - 1])
                        }
                      }}
                      disabled={uniqueWeeks.indexOf(selectedWeek) <= 0}
                      className="text-xs"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Selector de semanas horizontal */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {uniqueWeeks.map((weekKey) => {
                const weekStart = new Date(weekKey + "T00:00:00")
                const totals = getTotalsByWeek(weekKey)
                const isSelected = selectedWeek === weekKey

                return (
                  <Card
                    key={weekKey}
                    className={`min-w-[200px] cursor-pointer transition-all ${
                      isSelected ? "bg-blue-100 border-blue-300 shadow-md" : "bg-white hover:bg-gray-50 border-gray-200"
                    }`}
                    onClick={() => setSelectedWeek(weekKey)}
                  >
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className={`text-sm font-semibold ${isSelected ? "text-blue-900" : "text-gray-700"}`}>
                          Semana {formatWeek(weekStart)}
                        </div>
                        <div className="flex justify-center gap-2 mt-2">
                          <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">
                            {totals.totalOrders} pedidos
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            ${totals.total.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Contenido de la semana seleccionada */}
            {selectedWeek && (
              <div className="space-y-4">
                {(() => {
                  const weekStart = new Date(selectedWeek + "T00:00:00")
                  const weekTotals = getTotalsByWeek(selectedWeek)
                  const datesInWeek = getUniqueDatesInWeek(selectedWeek)

                  return (
                    <>
                      {/* Resumen de la semana */}
                      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Semana del {formatWeek(weekStart)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{weekTotals.totalOrders}</div>
                              <div className="text-xs text-gray-600">Total Pedidos</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                ${weekTotals.total.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-600">Ventas Totales</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-emerald-600">
                                ${weekTotals.delivered.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-600">Ya Cobrado</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                ${weekTotals.pending.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-600">Por Cobrar</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {weekTotals.deliveredOrders}/{weekTotals.totalOrders}
                              </div>
                              <div className="text-xs text-gray-600">Entregados</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Pedidos por día */}
                      {datesInWeek.map((date) => {
                        const dayOrders = getOrdersByDate(date)
                        const dayTotals = getTotalsByDate(date)

                        return (
                          <div key={date} className="space-y-3">
                            <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                              <h3 className="text-lg font-semibold text-gray-800">{formatDate(date)}</h3>
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRouteOrganizer(date)}
                                  className="flex items-center gap-2"
                                  disabled={saving}
                                >
                                  <Route className="w-4 h-4" />
                                  Organizar Ruta
                                </Button>
                                <div className="text-sm text-gray-600">
                                  {dayOrders.filter((order) => order.isDelivered).length} de {dayOrders.length}{" "}
                                  entregados
                                </div>
                                <Badge variant="outline" className="text-sm font-semibold">
                                  ${dayTotals.total.toLocaleString()}
                                </Badge>
                              </div>
                            </div>

                            {dayOrders.map((order) => (
                              <OrderCard key={order.id} order={order} dayOrders={dayOrders} />
                            ))}
                          </div>
                        )
                      })}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Profesional */}
      <footer className="mt-12 border-t bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Información del desarrollador */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Desarrollado por Moises Camilo Perez Prieto</h3>
              <p className="text-sm text-gray-600 flex items-center justify-center md:justify-start gap-1">
                Hecho con <Heart className="w-4 h-4 text-red-500 fill-current" /> para optimizar tu negocio
              </p>
            </div>

            {/* Redes sociales */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 font-medium">Sígueme en:</span>
              <div className="flex gap-3">
                <a
                  href="https://github.com/moisescamilo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-800 text-gray-600 hover:text-white transition-all duration-200 group"
                  title="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://instagram.com/moisescamilo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 text-gray-600 hover:text-white transition-all duration-200 group"
                  title="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://facebook.com/moisescamilo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 hover:bg-blue-600 text-gray-600 hover:text-white transition-all duration-200 group"
                  title="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Línea divisoria y copyright */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <p>© 2025 Sistema de Gestión de Entregas - Arepas. Todos los derechos reservados.</p>
              <p className="flex items-center gap-2">
                <span>Versión 2.0</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {isConnected ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Conectado
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      Modo Local
                    </>
                  )}
                </span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
