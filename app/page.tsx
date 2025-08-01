"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  createdAt?: string
}

const PRODUCTS = [
  { name: "Arepas de maíz", units: ["unidades"], price: 1500 },
  { name: "Kilos de masa de maíz", units: ["kilos"], price: 4000 },
  { name: "Queso tipo paisa", units: ["kilo", "libra"], price: { kilo: 18000, libra: 8000 } },
  { name: "Queso semiduro", units: ["kilo", "libra"], price: { kilo: 20000, libra: 9000 } },
  { name: "Limones", units: ["unidades"], price: 500 },
  { name: "Chorizos", units: ["unidades"], price: 3000 },
  { name: "Mora", units: ["kilos"], price: 8000 },
]

const DAYS_OF_WEEK = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

export default function ArepaDeliveryManager() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>("")
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null)
  const [routeOrders, setRouteOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "local" | "error">("local")
  const [lastSync, setLastSync] = useState<Date | null>(null)
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

  // Auto-sync cada 10 segundos
  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 10000) // Sync cada 10 segundos
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/orders")

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setConnectionStatus("connected")
        setLastSync(new Date())
        setError(null)
      } else {
        throw new Error("Error de servidor")
      }
    } catch (err) {
      console.error("Error loading orders:", err)
      // Fallback a localStorage
      const savedOrders = localStorage.getItem("arepa-orders")
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders))
      }
      setConnectionStatus("local")
      setError("Usando datos locales - Sin conexión al servidor")
    } finally {
      setLoading(false)
    }
  }

  const saveOrderToDatabase = async (order: Order) => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setConnectionStatus("connected")
        setLastSync(new Date())
        setError(null)

        // Backup en localStorage
        localStorage.setItem("arepa-orders", JSON.stringify(data.orders || []))
      } else {
        throw new Error("Error al guardar")
      }
    } catch (err) {
      console.error("Error saving order:", err)
      setConnectionStatus("error")
      setError("Error de conexión. Guardado localmente.")

      // Guardar en localStorage como backup
      const currentOrders = orders.filter((o) => o.id !== order.id)
      const updatedOrders = [...currentOrders, order]
      localStorage.setItem("arepa-orders", JSON.stringify(updatedOrders))
      setOrders(updatedOrders)
    } finally {
      setSaving(false)
    }
  }

  const deleteOrderFromDatabase = async (orderId: string) => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch("/api/orders", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setConnectionStatus("connected")
        setLastSync(new Date())
        setError(null)

        // Actualizar localStorage
        localStorage.setItem("arepa-orders", JSON.stringify(data.orders || []))
      } else {
        throw new Error("Error al eliminar")
      }
    } catch (err) {
      console.error("Error deleting order:", err)
      setConnectionStatus("error")
      setError("Error de conexión.")

      // Eliminar de localStorage
      const updatedOrders = orders.filter((order) => order.id !== orderId)
      localStorage.setItem("arepa-orders", JSON.stringify(updatedOrders))
      setOrders(updatedOrders)
    } finally {
      setSaving(false)
    }
  }

  // Calcular total del pedido
  useEffect(() => {
    const total = newOrder.products?.reduce((sum, product) => sum + product.total, 0) || 0
    setNewOrder((prev) => ({ ...prev, totalAmount: total }))
  }, [newOrder.products])

  const getProductPrice = (productName: string, unit: string): number => {
    const product = PRODUCTS.find((p) => p.name === productName)
    if (!product) return 0

    if (typeof product.price === "object") {
      return product.price[unit as keyof typeof product.price] || 0
    }
    return product.price as number
  }

  const addProduct = () => {
    setNewOrder((prev) => ({
      ...prev,
      products: [
        ...(prev.products || []),
        {
          name: "",
          quantity: 1,
          unit: "unidades",
          price: 0,
          total: 0,
        },
      ],
    }))
  }

  const updateProduct = (index: number, field: keyof Product, value: string | number) => {
    setNewOrder((prev) => {
      const updatedProducts =
        prev.products?.map((product, i) => {
          if (i === index) {
            const updatedProduct = { ...product, [field]: value }

            // Recalcular precio y total cuando cambie el producto o la unidad
            if (field === "name" || field === "unit") {
              const price = getProductPrice(updatedProduct.name, updatedProduct.unit)
              updatedProduct.price = price
              updatedProduct.total = price * updatedProduct.quantity
            }

            // Recalcular total cuando cambie la cantidad
            if (field === "quantity") {
              updatedProduct.total = updatedProduct.price * updatedProduct.quantity
            }

            return updatedProduct
          }
          return product
        }) || []

      return { ...prev, products: updatedProducts }
    })
  }

  const removeProduct = (index: number) => {
    setNewOrder((prev) => ({
      ...prev,
      products: prev.products?.filter((_, i) => i !== index) || [],
    }))
  }

  const saveOrder = async () => {
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

    const dayOrders = orders.filter((order) => order.deliveryDate === newOrder.deliveryDate)
    const maxRouteOrder = Math.max(...dayOrders.map((order) => order.routeOrder), 0)

    const orderToSave: Order = {
      id: editingOrder?.id || Date.now().toString(),
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
    }

    await saveOrderToDatabase(orderToSave)
    resetForm()
    setIsDialogOpen(false)
  }

  const resetForm = () => {
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
  }

  const editOrder = (order: Order) => {
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
  }

  const markAsDelivered = async (orderId: string, paymentMethod: "transferencia" | "efectivo") => {
    const order = orders.find((o) => o.id === orderId)
    if (order) {
      const updatedOrder = { ...order, isDelivered: true, paymentMethod }
      await saveOrderToDatabase(updatedOrder)
    }
  }

  const deleteOrder = async (orderId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este pedido?")) {
      await deleteOrderFromDatabase(orderId)
    }
  }

  const getOrdersByDate = (date: string) => {
    return orders.filter((order) => order.deliveryDate === date).sort((a, b) => a.routeOrder - b.routeOrder)
  }

  const getUniqueDates = () => {
    const dates = [...new Set(orders.map((order) => order.deliveryDate))].sort()
    return dates
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00")
    const dayName = DAYS_OF_WEEK[date.getDay()]
    const formattedDate = date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
    })
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${formattedDate}`
  }

  const getTotalsByDate = (date: string) => {
    const dayOrders = getOrdersByDate(date)
    const total = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    const delivered = dayOrders.filter((order) => order.isDelivered).reduce((sum, order) => sum + order.totalAmount, 0)
    return { total, delivered, pending: total - delivered }
  }

  // Funciones para drag and drop
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrder(orderId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, targetOrderId: string, date: string) => {
    e.preventDefault()

    if (!draggedOrder || draggedOrder === targetOrderId) {
      setDraggedOrder(null)
      return
    }

    const dayOrders = getOrdersByDate(date)
    const draggedIndex = dayOrders.findIndex((order) => order.id === draggedOrder)
    const targetIndex = dayOrders.findIndex((order) => order.id === targetOrderId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Reordenar los pedidos
    const newOrders = [...dayOrders]
    const [draggedItem] = newOrders.splice(draggedIndex, 1)
    newOrders.splice(targetIndex, 0, draggedItem)

    // Actualizar los routeOrder y guardar en base de datos
    for (let i = 0; i < newOrders.length; i++) {
      const updatedOrder = { ...newOrders[i], routeOrder: i + 1 }
      await saveOrderToDatabase(updatedOrder)
    }

    setDraggedOrder(null)
  }

  // Funciones para el organizador de rutas
  const openRouteOrganizer = (date: string) => {
    const dayOrders = getOrdersByDate(date)
    setRouteOrders([...dayOrders])
    setIsRouteDialogOpen(true)
  }

  const moveOrderInRoute = (fromIndex: number, toIndex: number) => {
    const newRouteOrders = [...routeOrders]
    const [movedOrder] = newRouteOrders.splice(fromIndex, 1)
    newRouteOrders.splice(toIndex, 0, movedOrder)
    setRouteOrders(newRouteOrders)
  }

  const saveRouteOrder = async () => {
    setSaving(true)
    for (let i = 0; i < routeOrders.length; i++) {
      const updatedOrder = { ...routeOrders[i], routeOrder: i + 1 }
      await saveOrderToDatabase(updatedOrder)
    }
    setSaving(false)
    setIsRouteDialogOpen(false)
  }

  const OrderCard = ({
    order,
    dayOrders,
    isDragging = false,
  }: { order: Order; dayOrders: Order[]; isDragging?: boolean }) => {
    const orderIndex = dayOrders.findIndex((o) => o.id === order.id)

    return (
      <Card
        className={`mb-4 cursor-move transition-all duration-200 ${
          order.isDelivered ? "bg-green-50 border-green-200" : ""
        } ${isDragging ? "opacity-50 transform rotate-2" : ""} ${
          draggedOrder === order.id ? "shadow-lg scale-105" : ""
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, order.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, order.id, order.deliveryDate)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <Badge variant="outline" className="text-xs">
                #{orderIndex + 1}
              </Badge>
              <CardTitle className="text-lg">{order.customerName}</CardTitle>
              {order.isDelivered && (
                <Badge className="bg-green-500">
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
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{order.address}</span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>
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
              <h4 className="font-medium text-sm mb-2">Productos:</h4>
              <ul className="text-sm space-y-1">
                {order.products.map((product, index) => (
                  <li key={index} className="flex justify-between">
                    <span>
                      • {product.quantity} {product.unit} de {product.name}
                    </span>
                    <span className="font-medium">${product.total.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Total:</span>
                <span>${order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {order.notes && (
              <div className="text-sm text-gray-600">
                <strong>Notas:</strong> {order.notes}
              </div>
            )}

            {!order.isDelivered ? (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => markAsDelivered(order.id, "transferencia")}
                  className="flex-1"
                  disabled={saving}
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  {saving ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : "Transferencia"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAsDelivered(order.id, "efectivo")}
                  className="flex-1"
                  disabled={saving}
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  {saving ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : "Efectivo"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary">Pagado por {order.paymentMethod}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const uniqueDates = getUniqueDates()

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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Panel de estado de conexión */}
        <Card className="mb-4 border-2 border-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {connectionStatus === "connected" ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : connectionStatus === "local" ? (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                Estado de Sincronización
              </CardTitle>
              <div className="flex items-center gap-2">
                {lastSync && (
                  <span className="text-xs text-gray-500">Última sync: {lastSync.toLocaleTimeString()}</span>
                )}
                <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-sm">
              {connectionStatus === "connected" && (
                <span className="text-green-600">✅ Conectado - Los pedidos se sincronizan automáticamente</span>
              )}
              {connectionStatus === "local" && (
                <span className="text-yellow-600">⚠️ Modo local - Los pedidos solo se guardan en este dispositivo</span>
              )}
              {connectionStatus === "error" && (
                <span className="text-red-600">❌ Error de conexión - Usando datos locales</span>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Entregas - Arepas</h1>
          <div className="flex gap-2">
            <Button onClick={loadOrders} variant="outline" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Actualizar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} disabled={saving}>
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
                          onValueChange={(value: "AM" | "PM") =>
                            setNewOrder((prev) => ({ ...prev, timeFormat: value }))
                          }
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
                          <div className="text-2xl font-bold text-green-700">
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
                              <Select
                                value={product.name}
                                onValueChange={(value) => updateProduct(index, "name", value)}
                              >
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
                                onChange={(e) => updateProduct(index, "quantity", Number.parseInt(e.target.value) || 1)}
                                className="mt-1"
                                min="1"
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
                    <Button onClick={saveOrder} className="flex-1 h-12 text-lg" disabled={saving}>
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

        {uniqueDates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No hay pedidos programados</p>
              <p className="text-sm text-gray-400 mt-2">Haz clic en "Nuevo Pedido" para comenzar</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
            <TabsList
              className="grid w-full"
              style={{ gridTemplateColumns: `repeat(${Math.min(uniqueDates.length, 4)}, 1fr)` }}
            >
              {uniqueDates.slice(0, 4).map((date) => {
                const totals = getTotalsByDate(date)
                return (
                  <TabsTrigger key={date} value={date} className="flex flex-col items-center gap-1 p-3">
                    <span className="text-sm font-medium">{formatDate(date)}</span>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getOrdersByDate(date).length} pedidos
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ${totals.total.toLocaleString()}
                      </Badge>
                    </div>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {uniqueDates.map((date) => {
              const dayOrders = getOrdersByDate(date)
              const totals = getTotalsByDate(date)

              return (
                <TabsContent key={date} value={date} className="mt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-blue-600">{dayOrders.length}</div>
                          <div className="text-sm text-gray-600">Total Pedidos</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-green-600">${totals.total.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Ventas Totales</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-emerald-600">
                            ${totals.delivered.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Ya Cobrado</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-orange-600">${totals.pending.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Por Cobrar</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Entregas del {formatDate(date)}</h2>
                      <div className="flex items-center gap-4">
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
                          {dayOrders.filter((order) => order.isDelivered).length} de {dayOrders.length} entregados
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> Arrastra las tarjetas de pedidos para cambiar el orden de entrega, o
                        usa el botón "Organizar Ruta" para una vista más cómoda.
                      </p>
                    </div>

                    {dayOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        dayOrders={dayOrders}
                        isDragging={draggedOrder === order.id}
                      />
                    ))}
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </div>
    </div>
  )
}
