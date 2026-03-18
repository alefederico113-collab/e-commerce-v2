require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

app.use(cors({ origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN }));
app.use(express.json());

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

app.get('/api/products', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, price, stock')
        .order('id', { ascending: true });

    if (error) {
        return res.status(500).json({ error: 'Database error while loading products.' });
    }

    return res.json(data);
});

app.get('/api/users/:id', async (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({ error: 'Invalid user id.' });
    }

    const { data, error } = await supabase
        .from('users')
        .select('id, name, credits')
        .eq('id', userId)
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'User not found.' });
    }

    return res.json(data);
});

app.post('/api/buy', async (req, res) => {
    const userId = Number(req.body.userId);
    const productId = Number(req.body.productId);

    if (!Number.isInteger(userId) || !Number.isInteger(productId)) {
        return res.status(400).json({ error: 'userId and productId are required.' });
    }

    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, credits')
        .eq('id', userId)
        .single();

    if (userError || !user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price, stock')
        .eq('id', productId)
        .single();

    if (productError || !product) {
        return res.status(404).json({ error: 'Product not found.' });
    }

    if (product.stock <= 0) {
        return res.status(400).json({ error: 'Product out of stock.' });
    }

    if (user.credits < product.price) {
        return res.status(400).json({ error: 'Insufficient credits.' });
    }

    const updatedCredits = user.credits - product.price;
    const updatedStock = product.stock - 1;

    const { error: userUpdateError } = await supabase
        .from('users')
        .update({ credits: updatedCredits })
        .eq('id', userId);

    if (userUpdateError) {
        return res.status(500).json({ error: 'Failed to update user credits.' });
    }

    const { error: productUpdateError } = await supabase
        .from('products')
        .update({ stock: updatedStock })
        .eq('id', productId);

    if (productUpdateError) {
        return res.status(500).json({ error: 'Failed to update product stock.' });
    }

    return res.json({
        message: `Acquisto completato: ${product.name}`,
        userCredits: updatedCredits,
        productStock: updatedStock
    });
});

app.post('/api/admin/products', async (req, res) => {
    const name = String(req.body.name || '').trim();
    const price = Number(req.body.price);
    const stock = Number(req.body.stock);

    if (!name || !Number.isFinite(price) || !Number.isFinite(stock) || price < 0 || stock < 0) {
        return res.status(400).json({ error: 'Invalid product payload.' });
    }

    const { data, error } = await supabase
        .from('products')
        .insert([{ name, price, stock }])
        .select('id, name, price, stock')
        .single();

    if (error) {
        return res.status(500).json({ error: 'Failed to create product.' });
    }

    return res.status(201).json({ message: 'Product created.', product: data });
});

app.put('/api/admin/products/:id', async (req, res) => {
    const productId = Number(req.params.id);
    const stock = Number(req.body.stock);

    if (!Number.isInteger(productId) || !Number.isFinite(stock) || stock < 0) {
        return res.status(400).json({ error: 'Invalid product id or stock.' });
    }

    const { data, error } = await supabase
        .from('products')
        .update({ stock })
        .eq('id', productId)
        .select('id, name, price, stock')
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json({ message: 'Stock updated.', product: data });
});

app.post('/api/admin/users/:id/credits', async (req, res) => {
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