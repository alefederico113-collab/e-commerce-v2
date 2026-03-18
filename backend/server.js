require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const TECH_PRODUCTS = [
    {
        name: 'Laptop Pro 14',
        description: 'Notebook leggero con CPU di ultima generazione e autonomia elevata.',
        price: 1499,
        stock: 8,
        discount_percent: 10,
        category: 'Laptop',
        image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80'
    },
    {
        name: 'Smartphone X12',
        description: 'Display OLED, tripla fotocamera e ricarica rapida.',
        price: 899,
        stock: 14,
        discount_percent: 5,
        category: 'Smartphone',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80'
    },
    {
        name: 'Mechanical Keyboard TKL',
        description: 'Tastiera meccanica hot-swap RGB per gaming e produttivita.',
        price: 129,
        stock: 22,
        discount_percent: 15,
        category: 'Periferiche',
        image_url: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80'
    },
    {
        name: 'Wireless Mouse Ultra',
        description: 'Mouse ergonomico wireless con sensore ad alta precisione.',
        price: 79,
        stock: 30,
        discount_percent: 0,
        category: 'Periferiche',
        image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80'
    },
    {
        name: '27 4K Monitor',
        description: 'Monitor IPS 4K per creativita e sviluppo software.',
        price: 449,
        stock: 10,
        discount_percent: 7,
        category: 'Monitor',
        image_url: 'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=900&q=80'
    },
    {
        name: 'Noise Cancelling Headphones',
        description: 'Cuffie over-ear con cancellazione attiva del rumore.',
        price: 249,
        stock: 18,
        discount_percent: 12,
        category: 'Audio',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'
    }
];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    process.exit(1);
}

if (JWT_SECRET === 'change-this-in-production') {
    console.warn('WARNING: using default JWT_SECRET. Set JWT_SECRET in production.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

app.use(cors({ origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN }));
app.use(express.json());

const sanitizeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    credits: user.credits
});

const buildProduct = (product) => {
    const discount = Number(product.discount_percent || 0);
    const basePrice = Number(product.price || 0);
    const discountedPrice = Math.max(0, Math.round(basePrice * (1 - discount / 100)));

    return {
        ...product,
        discount_percent: discount,
        final_price: discountedPrice
    };
};

const signToken = (user) => jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
);

const authRequired = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const userId = Number(payload.sub);
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, credits')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token user.' });
        }

        req.user = user;
        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

const adminRequired = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
    }

    return next();
};

app.get('/', (req, res) => {
    res.json({
        ok: true,
        service: 'ecommerce-backend',
        message: 'Backend is running. Use /api/health for health checks.'
    });
});

app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'ecommerce-backend' });
});

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'ecommerce-backend' });
});

app.get('/api/tech-products', (req, res) => {
    res.json(TECH_PRODUCTS);
});

app.post('/api/auth/signup', async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (name.length < 2 || !email.includes('@') || password.length < 8) {
        return res.status(400).json({ error: 'Invalid signup payload.' });
    }

    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (existing) {
        return res.status(409).json({ error: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase
        .from('users')
        .insert([{
            name,
            email,
            password_hash: passwordHash,
            role: 'customer',
            credits: 250
        }])
        .select('id, name, email, role, credits')
        .single();

    if (error || !user) {
        return res.status(500).json({ error: 'Failed to create user.' });
    }

    const token = signToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, role, credits, password_hash')
        .eq('email', email)
        .single();

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
});

app.get('/api/auth/me', authRequired, (req, res) => {
    res.json(sanitizeUser(req.user));
});

app.get('/api/products', async (req, res) => {
    const search = String(req.query.search || '').trim();

    let query = supabase
        .from('products')
        .select('id, name, description, category, image_url, price, discount_percent, stock')
        .order('id', { ascending: true });

    if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ error: 'Database error while loading products.' });
    }

    return res.json(data.map(buildProduct));
});

app.get('/api/products/:id', async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({ error: 'Invalid product id.' });
    }

    const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, description, category, image_url, price, discount_percent, stock')
        .eq('id', productId)
        .single();

    if (productError || !product) {
        return res.status(404).json({ error: 'Product not found.' });
    }

    const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, user_id, rating, comment, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

    if (reviewsError) {
        return res.status(500).json({ error: 'Failed to load reviews.' });
    }

    const userIds = [...new Set(reviews.map((review) => review.user_id))];
    let userMap = {};
    if (userIds.length > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, name')
            .in('id', userIds);
        userMap = (users || []).reduce((acc, user) => {
            acc[user.id] = user.name;
            return acc;
        }, {});
    }

    const hydratedReviews = reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        user_name: userMap[review.user_id] || 'Utente'
    }));

    return res.json({ product: buildProduct(product), reviews: hydratedReviews });
});

app.post('/api/products/:id/reviews', authRequired, async (req, res) => {
    const productId = Number(req.params.id);
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();

    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid review payload.' });
    }

    const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('id', productId)
        .single();

    if (productError || !product) {
        return res.status(404).json({ error: 'Product not found.' });
    }

    const { data, error } = await supabase
        .from('reviews')
        .insert([{
            user_id: req.user.id,
            product_id: productId,
            rating,
            comment
        }])
        .select('id, rating, comment, created_at')
        .single();

    if (error || !data) {
        return res.status(500).json({ error: 'Failed to submit review.' });
    }

    return res.status(201).json({
        ...data,
        user_name: req.user.name
    });
});

app.post('/api/cart/checkout', authRequired, async (req, res) => {
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty.' });
    }

    const normalizedItems = items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity)
    })).filter((item) => Number.isInteger(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0);

    if (normalizedItems.length === 0) {
        return res.status(400).json({ error: 'Invalid cart payload.' });
    }

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, discount_percent, stock, image_url')
        .in('id', productIds);

    if (productsError || !products) {
        return res.status(500).json({ error: 'Failed to load products for checkout.' });
    }

    const productMap = products.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
    }, {});

    let total = 0;
    const orderItems = [];
    for (const item of normalizedItems) {
        const product = productMap[item.productId];
        if (!product) {
            return res.status(404).json({ error: `Product ${item.productId} not found.` });
        }

        if (product.stock < item.quantity) {
            return res.status(400).json({ error: `Insufficient stock for ${product.name}.` });
        }

        const unitPrice = Math.max(0, Math.round(Number(product.price) * (1 - Number(product.discount_percent || 0) / 100)));
        total += unitPrice * item.quantity;
        orderItems.push({
            product_id: product.id,
            quantity: item.quantity,
            unit_price: unitPrice
        });
    }

    if (req.user.credits < total) {
        return res.status(400).json({ error: 'Insufficient credits.' });
    }

    const { error: userUpdateError } = await supabase
        .from('users')
        .update({ credits: req.user.credits - total })
        .eq('id', req.user.id);

    if (userUpdateError) {
        return res.status(500).json({ error: 'Failed to update user credits.' });
    }

    for (const item of normalizedItems) {
        const product = productMap[item.productId];
        const { error: productUpdateError } = await supabase
            .from('products')
            .update({ stock: product.stock - item.quantity })
            .eq('id', product.id);

        if (productUpdateError) {
            return res.status(500).json({ error: `Failed to update stock for ${product.name}.` });
        }
    }

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
            user_id: req.user.id,
            total,
            status: 'pending'
        }])
        .select('id, status, total, created_at')
        .single();

    if (orderError || !order) {
        return res.status(500).json({ error: 'Failed to create order.' });
    }

    const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems.map((item) => ({
            order_id: order.id,
            ...item
        })));

    if (orderItemsError) {
        return res.status(500).json({ error: 'Failed to create order items.' });
    }

    return res.status(201).json({
        message: 'Order placed successfully.',
        order
    });
});

app.get('/api/orders', authRequired, async (req, res) => {
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, status, created_at')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

    if (ordersError) {
        return res.status(500).json({ error: 'Failed to load orders.' });
    }

    const orderIds = orders.map((order) => order.id);
    if (orderIds.length === 0) {
        return res.json([]);
    }

    const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, product_id, quantity, unit_price')
        .in('order_id', orderIds);

    if (itemsError) {
        return res.status(500).json({ error: 'Failed to load order items.' });
    }

    const productIds = [...new Set(items.map((item) => item.product_id))];
    const { data: products } = await supabase
        .from('products')
        .select('id, name, image_url')
        .in('id', productIds);

    const productMap = (products || []).reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
    }, {});

    const itemsByOrder = items.reduce((acc, item) => {
        if (!acc[item.order_id]) {
            acc[item.order_id] = [];
        }

        acc[item.order_id].push({
            ...item,
            product_name: productMap[item.product_id]?.name || 'Prodotto',
            image_url: productMap[item.product_id]?.image_url || null
        });

        return acc;
    }, {});

    return res.json(orders.map((order) => ({
        ...order,
        items: itemsByOrder[order.id] || []
    })));
});

app.get('/api/admin/dashboard', authRequired, adminRequired, async (req, res) => {
    const [{ count: usersCount }, { count: productsCount }, { count: ordersCount }, { count: pendingOrdersCount }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    return res.json({
        users: usersCount || 0,
        products: productsCount || 0,
        orders: ordersCount || 0,
        pending_orders: pendingOrdersCount || 0
    });
});

app.get('/api/admin/orders', authRequired, adminRequired, async (req, res) => {
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, user_id, total, status, created_at')
        .order('created_at', { ascending: false });

    if (ordersError) {
        return res.status(500).json({ error: 'Failed to load admin orders.' });
    }

    const userIds = [...new Set(orders.map((order) => order.user_id))];
    const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

    const userMap = (users || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
    }, {});

    return res.json(orders.map((order) => ({
        ...order,
        user: userMap[order.user_id] || null
    })));
});

app.patch('/api/admin/orders/:id/status', authRequired, adminRequired, async (req, res) => {
    const orderId = Number(req.params.id);
    const status = String(req.body.status || '').trim().toLowerCase();
    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!Number.isInteger(orderId) || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid order id or status.' });
    }

    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select('id, status, total, created_at')
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'Order not found.' });
    }

    return res.json({ message: 'Order status updated.', order: data });
});

app.post('/api/admin/products', authRequired, adminRequired, async (req, res) => {
    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    const category = String(req.body.category || 'Tech').trim();
    const imageUrl = String(req.body.image_url || '').trim();
    const price = Number(req.body.price);
    const stock = Number(req.body.stock);
    const discountPercent = Number(req.body.discount_percent || 0);

    if (!name || !Number.isFinite(price) || !Number.isFinite(stock) || !Number.isFinite(discountPercent)
        || price < 0 || stock < 0 || discountPercent < 0 || discountPercent > 90) {
        return res.status(400).json({ error: 'Invalid product payload.' });
    }

    const { data, error } = await supabase
        .from('products')
        .insert([{
            name,
            description,
            category,
            image_url: imageUrl,
            price,
            stock,
            discount_percent: discountPercent
        }])
        .select('id, name, description, category, image_url, price, discount_percent, stock')
        .single();

    if (error) {
        return res.status(500).json({ error: 'Failed to create product.' });
    }

    return res.status(201).json({ message: 'Product created.', product: buildProduct(data) });
});

app.patch('/api/admin/products/:id', authRequired, adminRequired, async (req, res) => {
    const productId = Number(req.params.id);
    const updates = {};
    const allowedKeys = ['name', 'description', 'category', 'image_url', 'price', 'stock', 'discount_percent'];

    for (const key of allowedKeys) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
            updates[key] = req.body[key];
        }
    }

    if (!Number.isInteger(productId) || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Invalid product update request.' });
    }

    if (updates.price !== undefined && (!Number.isFinite(Number(updates.price)) || Number(updates.price) < 0)) {
        return res.status(400).json({ error: 'Invalid price.' });
    }
    if (updates.stock !== undefined && (!Number.isFinite(Number(updates.stock)) || Number(updates.stock) < 0)) {
        return res.status(400).json({ error: 'Invalid stock.' });
    }
    if (updates.discount_percent !== undefined
        && (!Number.isFinite(Number(updates.discount_percent))
        || Number(updates.discount_percent) < 0
        || Number(updates.discount_percent) > 90)) {
        return res.status(400).json({ error: 'Invalid discount percent.' });
    }

    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);
    if (updates.discount_percent !== undefined) updates.discount_percent = Number(updates.discount_percent);


    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select('id, name, description, category, image_url, price, discount_percent, stock')
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json({ message: 'Product updated.', product: buildProduct(data) });
});

app.post('/api/admin/import-tech-products', authRequired, adminRequired, async (req, res) => {
    const names = TECH_PRODUCTS.map((product) => product.name);
    const { data: existingProducts } = await supabase
        .from('products')
        .select('name')
        .in('name', names);

    const existingNames = new Set((existingProducts || []).map((product) => product.name));
    const toInsert = TECH_PRODUCTS.filter((product) => !existingNames.has(product.name));

    if (toInsert.length === 0) {
        return res.json({ message: 'No new products to import.', imported: 0 });
    }

    const { error } = await supabase
        .from('products')
        .insert(toInsert);

    if (error) {
        return res.status(500).json({ error: 'Failed to import tech products.' });
    }

    return res.status(201).json({
        message: 'Tech products imported successfully.',
        imported: toInsert.length
    });
});

app.post('/api/admin/users/:id/credits', authRequired, adminRequired, async (req, res) => {
    const userId = Number(req.params.id);
    const amount = Number(req.body.amount);

    if (!Number.isInteger(userId) || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid user id or amount.' });
    }

    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, credits')
        .eq('id', userId)
        .single();

    if (userError || !user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    const newCredits = user.credits + amount;
    const { data, error } = await supabase
        .from('users')
        .update({ credits: newCredits })
        .eq('id', userId)
        .select('id, name, credits')
        .single();

    if (error) {
        return res.status(500).json({ error: 'Failed to update credits.' });
    }

    return res.json({ message: `Added ${amount} credits.`, user: data });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});