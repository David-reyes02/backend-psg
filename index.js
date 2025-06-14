import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.get('/api/products', async (req, res) => {
  try {
    const products = await stripe.products.list({ limit: 10 });
    const prices = await stripe.prices.list();

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

// Nuevo endpoint para producto individual
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor backend en http://localhost:${PORT}`));
