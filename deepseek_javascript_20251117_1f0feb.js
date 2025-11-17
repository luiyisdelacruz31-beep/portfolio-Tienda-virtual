// Variables globales
let carrito = [];
let productos = [];

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    cargarProductos();
    cargarCarrito();
    actualizarCarritoUI();
});

// Cargar productos desde la API
async function cargarProductos() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        productos = await response.json();
        mostrarProductos(productos);
    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarError('No se pudieron cargar los productos. Intenta más tarde.');
    }
}

// Mostrar productos en el DOM
function mostrarProductos(productos) {
    const container = document.getElementById('productos-container');
    container.innerHTML = '';

    productos.forEach(producto => {
        const card = crearCardProducto(producto);
        container.appendChild(card);
    });
}

// Crear card de producto
function crearCardProducto(producto) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3';

    col.innerHTML = `
        <div class="card product-card h-100">
            <img src="${producto.image}" class="card-img-top product-image" alt="${producto.title}">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${producto.title.substring(0, 50)}...</h5>
                <p class="card-text flex-grow-1">${producto.description.substring(0, 100)}...</p>
                <div class="mt-auto">
                    <p class="h5 text-primary">$${producto.price}</p>
                    <button class="btn btn-outline-primary w-100" onclick="abrirModalProducto(${producto.id})">
                        <i class="fas fa-eye"></i> Ver más
                    </button>
                </div>
            </div>
        </div>
    `;

    return col;
}

// Abrir modal con detalles del producto
function abrirModalProducto(id) {
    const producto = productos.find(p => p.id === id);
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <img src="${producto.image}" class="modal-image w-100" alt="${producto.title}">
            </div>
            <div class="col-md-6">
                <h4>${producto.title}</h4>
                <p><strong>Categoría:</strong> ${producto.category}</p>
                <p><strong>Descripción:</strong> ${producto.description}</p>
                <p class="h3 text-primary">$${producto.price}</p>
                <div class="mt-3">
                    <label for="cantidad"><strong>Cantidad:</strong></label>
                    <input type="number" id="cantidad-producto" class="form-control" value="1" min="1">
                </div>
                <button class="btn btn-success mt-3 w-100" onclick="agregarAlCarrito(${producto.id})">
                    <i class="fas fa-cart-plus"></i> Agregar al Carrito
                </button>
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('productoModal'));
    modal.show();
}

// Funciones del Carrito
function agregarAlCarrito(productoId) {
    const cantidad = parseInt(document.getElementById('cantidad-producto').value) || 1;
    const producto = productos.find(p => p.id === productoId);
    
    const itemExistente = carrito.find(item => item.id === productoId);
    
    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        carrito.push({
            id: producto.id,
            title: producto.title,
            price: producto.price,
            image: producto.image,
            cantidad: cantidad
        });
    }
    
    guardarCarrito();
    actualizarCarritoUI();
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('productoModal'));
    modal.hide();
    
    // Mostrar alerta de éxito
    mostrarAlerta('Producto agregado al carrito!', 'success');
}

function eliminarDelCarrito(productoId) {
    carrito = carrito.filter(item => item.id !== productoId);
    guardarCarrito();
    actualizarCarritoUI();
    mostrarAlerta('Producto eliminado del carrito', 'warning');
}

function actualizarCantidad(productoId, nuevaCantidad) {
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(productoId);
        return;
    }
    
    const item = carrito.find(item => item.id === productoId);
    if (item) {
        item.cantidad = nuevaCantidad;
        guardarCarrito();
        actualizarCarritoUI();
    }
}

// Persistencia del carrito
function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function cargarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
    }
}

// Actualizar UI del carrito
function actualizarCarritoUI() {
    const carritoCount = document.querySelector('.cart-count');
    const carritoItems = document.getElementById('carrito-items');
    const carritoTotal = document.getElementById('carrito-total');
    
    // Actualizar contador
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    carritoCount.textContent = totalItems;
    
    // Actualizar items del carrito
    carritoItems.innerHTML = '';
    
    if (carrito.length === 0) {
        carritoItems.innerHTML = '<p class="text-center">Tu carrito está vacío</p>';
        carritoTotal.textContent = '0';
        return;
    }
    
    let total = 0;
    
    carrito.forEach(item => {
        const subtotal = item.price * item.cantidad;
        total += subtotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${item.image}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: contain;">
                <div class="ms-3">
                    <h6>${item.title.substring(0, 30)}...</h6>
                    <p class="mb-0">$${item.price} x ${item.cantidad}</p>
                </div>
            </div>
            <div class="cart-item-controls">
                <div class="d-flex align-items-center">
                    <button class="quantity-btn" onclick="actualizarCantidad(${item.id}, ${item.cantidad - 1})">-</button>
                    <span class="mx-2">${item.cantidad}</span>
                    <button class="quantity-btn" onclick="actualizarCantidad(${item.id}, ${item.cantidad + 1})">+</button>
                </div>
                <button class="btn btn-outline-danger btn-sm ms-2" onclick="eliminarDelCarrito(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        carritoItems.appendChild(itemElement);
    });
    
    carritoTotal.textContent = total.toFixed(2);
}

// Pasarela de Pago
function iniciarPago() {
    if (carrito.length === 0) {
        mostrarAlerta('Tu carrito está vacío', 'warning');
        return;
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('carritoModal'));
    modal.hide();
    
    // Crear formulario de pago
    const paymentForm = crearFormularioPago();
    document.body.appendChild(paymentForm);
}

function crearFormularioPago() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    overlay.innerHTML = `
        <div class="payment-form bg-white p-4 rounded" style="max-width: 500px; width: 90%;">
            <h3 class="text-center mb-4">💳 Información de Pago</h3>
            <form id="formPago">
                <div class="form-group">
                    <label>Nombre Completo</label>
                    <input type="text" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Número de Tarjeta</label>
                    <input type="text" class="form-control" placeholder="1234 5678 9012 3456" required>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Fecha de Vencimiento</label>
                            <input type="text" class="form-control" placeholder="MM/AA" required>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>CVV</label>
                            <input type="text" class="form-control" placeholder="123" required>
                        </div>
                    </div>
                </div>
                <div class="d-grid gap-2 mt-4">
                    <button type="submit" class="btn btn-success btn-lg">✅ Pagar $${calcularTotal()}</button>
                    <button type="button" class="btn btn-secondary" onclick="cerrarFormularioPago()">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    overlay.querySelector('#formPago').addEventListener('submit', procesarPago);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            cerrarFormularioPago();
        }
    });
    
    return overlay;
}

function calcularTotal() {
    return carrito.reduce((total, item) => total + (item.price * item.cantidad), 0).toFixed(2);
}

function cerrarFormularioPago() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function procesarPago(e) {
    e.preventDefault();
    
    // Simular procesamiento de pago
    mostrarAlerta('Procesando pago...', 'info');
    
    setTimeout(() => {
        cerrarFormularioPago();
        generarTicket();
        vaciarCarrito();
        mostrarAlerta('¡Pago exitoso! Se ha generado tu ticket.', 'success');
    }, 2000);
}

// Generar Ticket PDF
function generarTicket() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Tamaño similar a ticket térmico
    });
    
    const fecha = new Date().toLocaleString();
    const total = calcularTotal();
    
    // Configurar fuente monoespaciada
    doc.setFont('courier');
    doc.setFontSize(10);
    
    let y = 10;
    
    // Encabezado
    doc.text('SHOPMASTER', 40, y, { align: 'center' });
    y += 5;
    doc.text('-----------------------------', 40, y, { align: 'center' });
    y += 5;
    doc.text('TICKET DE COMPRA', 40, y, { align: 'center' });
    y += 5;
    doc.text(fecha, 40, y, { align: 'center' });
    y += 8;
    
    // Productos
    doc.text('PRODUCTOS:', 5, y);
    y += 5;
    
    carrito.forEach(item => {
        const nombre = item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title;
        const subtotal = (item.price * item.cantidad).toFixed(2);
        
        doc.text(`${item.cantidad}x ${nombre}`, 5, y);
        y += 4;
        doc.text(`$${subtotal}`, 65, y - 4, { align: 'right' });
    });
    
    y += 5;
    doc.text('-----------------------------', 40, y, { align: 'center' });
    y += 5;
    doc.text(`TOTAL: $${total}`, 65, y, { align: 'right' });
    y += 8;
    doc.text('¡GRACIAS POR SU COMPRA!', 40, y, { align: 'center' });
    
    // Guardar PDF
    doc.save(`ticket_shopmaster_${Date.now()}.pdf`);
}

function vaciarCarrito() {
    carrito = [];
    guardarCarrito();
    actualizarCarritoUI();
}

// Utilidades
function mostrarAlerta(mensaje, tipo) {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

function mostrarError(mensaje) {
    mostrarAlerta(mensaje, 'danger');
}

// Abrir modal del carrito
function abrirCarrito() {
    const modal = new bootstrap.Modal(document.getElementById('carritoModal'));
    modal.show();
}

// Event listeners
document.querySelector('.cart-icon').addEventListener('click', abrirCarrito);