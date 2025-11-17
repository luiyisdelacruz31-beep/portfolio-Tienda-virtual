document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const productModal = new bootstrap.Modal(document.getElementById('product-modal'));
    const productModalTitle = document.getElementById('product-modal-title');
    const productModalBody = document.getElementById('product-modal-body');
    const cartButton = document.getElementById('cart-button');
    const cartModal = new bootstrap.Modal(document.getElementById('cart-modal'));
    const cartModalBody = document.getElementById('cart-modal-body');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkout-button');
    const paymentModal = new bootstrap.Modal(document.getElementById('payment-modal'));
    const paymentForm = document.getElementById('payment-form');

    let products = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Fetch products from API
    async function fetchProducts() {
        try {
            const response = await fetch('https://fakestoreapi.com/products');
            products = await response.json();
            renderProducts();
            updateCart();
        } catch (error) {
            console.error('Error fetching products:', error);
            productGrid.innerHTML = '<p class="text-center text-danger">No se pudieron cargar los productos.</p>';
        }
    }

    // Render products in the grid
    function renderProducts() {
        productGrid.innerHTML = '';
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'col-md-4 col-lg-3 mb-4';
            card.innerHTML = `
                <div class="card h-100 product-card">
                    <img src="${product.image}" class="card-img-top" alt="${product.title}">
                    <div class="card-body">
                        <h5 class="card-title">${product.title}</h5>
                        <p class="card-text fw-bold">$${product.price.toFixed(2)}</p>
                    </div>
                    <div class="card-footer bg-transparent border-top-0">
                        <button class="btn btn-primary-custom w-100 view-details-btn" data-id="${product.id}">Ver más</button>
                    </div>
                </div>
            `;
            card.querySelector('.view-details-btn').addEventListener('click', () => showProductModal(product.id));
            productGrid.appendChild(card);
        });
    }

    // Show product details in a modal
    function showProductModal(productId) {
        const product = products.find(p => p.id === productId);
        productModalTitle.textContent = product.title;
        productModalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6 text-center">
                    <img src="${product.image}" class="img-fluid product-image" alt="${product.title}">
                </div>
                <div class="col-md-6">
                    <h4>${product.category}</h4>
                    <p>${product.description}</p>
                    <p class="fs-4 fw-bold">$${product.price.toFixed(2)}</p>
                    <div class="d-flex align-items-center mb-3">
                        <label for="quantity-selector" class="form-label me-2">Cantidad:</label>
                        <input type="number" id="quantity-selector" class="form-control" value="1" min="1" style="width: 70px;">
                    </div>
                    <button class="btn btn-secondary-custom w-100 add-to-cart-btn" data-id="${product.id}">🛒 Agregar al carrito</button>
                </div>
            </div>
        `;
        productModalBody.querySelector('.add-to-cart-btn').addEventListener('click', () => {
            const quantity = parseInt(document.getElementById('quantity-selector').value);
            addToCart(product.id, quantity);
            productModal.hide();
        });
        productModal.show();
    }

    // Add item to cart
    function addToCart(productId, quantity = 1) {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ id: productId, quantity });
        }
        updateCart();
    }

    // Remove item from cart
    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        updateCart();
    }

    // Update item quantity in cart
    function updateCartQuantity(productId, quantity) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            if (quantity > 0) {
                item.quantity = quantity;
            } else {
                removeFromCart(productId);
            }
        }
        updateCart();
    }

    // Update cart UI and localStorage
    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartModal();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }

    // Render cart items in the modal
    function renderCartModal() {
        cartModalBody.innerHTML = '';
        let total = 0;
        if (cart.length === 0) {
            cartModalBody.innerHTML = '<p>El carrito está vacío.</p>';
            cartTotal.textContent = '$0.00';
            return;
        }

        cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                total += product.price * item.quantity;
                const cartItem = document.createElement('div');
                cartItem.className = 'd-flex justify-content-between align-items-center mb-3';
                cartItem.innerHTML = `
                    <div class="d-flex align-items-center">
                        <img src="${product.image}" class="cart-item-img me-3" alt="${product.title}">
                        <div>
                            <h6 class="mb-0">${product.title}</h6>
                            <small>$${product.price.toFixed(2)}</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center">
                        <input type="number" class="form-control me-2" value="${item.quantity}" min="1" style="width: 70px;" data-id="${item.id}">
                        <button class="btn btn-danger btn-sm remove-from-cart-btn" data-id="${item.id}">&times;</button>
                    </div>
                `;
                cartItem.querySelector('input').addEventListener('change', (e) => {
                    updateCartQuantity(item.id, parseInt(e.target.value));
                });
                cartItem.querySelector('.remove-from-cart-btn').addEventListener('click', () => {
                    removeFromCart(item.id);
                });
                cartModalBody.appendChild(cartItem);
            }
        });
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    // Show cart modal
    cartButton.addEventListener('click', () => {
        renderCartModal();
        cartModal.show();
    });

    // Go to payment
    checkoutButton.addEventListener('click', () => {
        if (cart.length > 0) {
            cartModal.hide();
            paymentModal.show();
        } else {
            alert('El carrito está vacío.');
        }
    });

    // Handle payment form submission
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = document.getElementById('full-name').value;
        // Basic validation
        if (fullName && document.getElementById('card-number').value && document.getElementById('expiry-date').value && document.getElementById('cvv').value) {
            generatePDF(fullName);
            paymentModal.hide();
            cart = [];
            updateCart();
            alert('¡Pago exitoso! Se ha generado su recibo.');
        } else {
            alert('Por favor, complete todos los campos.');
        }
    });

    // Generate PDF ticket
    function generatePDF(customerName) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [58, 150] // Thermal receipt paper size (58mm width)
        });

        let y = 10;
        doc.setFontSize(10);
        doc.text('ShopMaster', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 5;
        doc.setFontSize(8);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 5, y);
        y += 5;
        doc.text(`Cliente: ${customerName}`, 5, y);
        y += 5;
        doc.line(5, y, 53, y); // Separator
        y += 5;

        doc.text('Producto', 5, y);
        doc.text('Cant.', 35, y);
        doc.text('Total', 45, y, { align: 'right' });
        y += 3;
        doc.line(5, y, 53, y); // Separator
        y += 5;

        let total = 0;
        cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                const itemTotal = product.price * item.quantity;
                total += itemTotal;
                // Split long product titles
                const titleLines = doc.splitTextToSize(product.title, 28);
                doc.text(titleLines, 5, y);
                doc.text(item.quantity.toString(), 35, y);
                doc.text(`$${itemTotal.toFixed(2)}`, 50, y, { align: 'right' });
                y += (titleLines.length * 4) + 2; // Adjust y position based on number of lines
            }
        });

        doc.line(5, y, 53, y); // Separator
        y += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', 5, y);
        doc.text(`$${total.toFixed(2)}`, 50, y, { align: 'right' });
        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Gracias por su compra!', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });

        doc.save('recibo-ShopMaster.pdf');
    }

    // Initial load
    fetchProducts();
});
