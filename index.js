// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Stripe = require('stripe');

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

app.use(cors());
app.use(express.json());

// Listado de productos con precios
app.get('/api/products', async (req, res) => {
  try {
    const products = await stripe.products.list({ limit: 20 });
    const prices = await stripe.prices.list({ limit: 20 });

    const data = products.data.map(p => {
      const pr = prices.data.find(pri => pri.product === p.id);
      return {
        id: p.id,
        nameProduct: p.name,
        description: p.description,
        img: p.images[0] || null,
        price: (pr?.unit_amount || 0) / 100,
        priceId: pr?.id || null
      };
    });

    res.json(data);
  } catch (err) {
    console.error('Error en /api/products:', err.message);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Producto individual
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await stripe.products.retrieve(req.params.id);
    const prices = await stripe.prices.list({ product: product.id, limit: 1 });
    const pr = prices.data[0];

    res.json({
      id: product.id,
      nameProduct: product.name,
      description: product.description,
      img: product.images[0] || null,
      price: (pr?.unit_amount || 0) / 100,
      priceId: pr?.id || null
    });
  } catch (err) {
    console.error('Error en /api/products/:id:', err.message);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// Crear sesión de pago
app.post('/api/create-checkout-session', async (req, res) => {
  const { items } = req.body;
  try {
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.nameProduct,
          images: [item.img],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: 'https://psg-store.vercel.app/success',
      cancel_url: 'https://psg-store.vercel.app/cancel',
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error('Error al crear checkout:', err.message);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor backend corriendo en puerto ${PORT}`));
