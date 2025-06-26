import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

// Endpoint para listar productos con precios
app.get('/api/products', async (req, res) => {
  try {
    const products = await stripe.products.list({ limit: 20 });
    const prices = await stripe.prices.list({ limit: 20 });

    const data = products.data.map(product => {
      const price = prices.data.find(p => p.product === product.id);
      return {
        id: product.id,
        nameProduct: product.name,
        description: product.description,
        img: product.images[0] || null,
        price: (price?.unit_amount || 0) / 100,
        priceId: price?.id || null
      };
    });

    res.json(data);
  } catch (err) {
    console.error('Error en /api/products:', err.message);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Endpoint para obtener un producto individual
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await stripe.products.retrieve(id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const prices = await stripe.prices.list({ product: id });
    const price = prices.data[0];

    const data = {
      id: product.id,
      nameProduct: product.name,
      description: product.description,
      img: product.images[0] || null,
      price: (price?.unit_amount || 0) / 100,
      priceId: price?.id || null
    };

    res.json(data);
  } catch (err) {
    console.error('Error en /api/products/:id:', err.message);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// Endpoint para crear sesión de checkout en Stripe
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
    console.error('Error en checkout:', err.message);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor backend en http://localhost:${PORT}`));
