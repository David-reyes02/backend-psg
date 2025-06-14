// index.js
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Usar variable de entorno

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
        img: product.images[0],
        price: (price?.unit_amount || 0) / 100,
        priceId: price?.id
      };
    });

    res.json(data);
  } catch (err) {
    console.error('Error en /api/products:', err.message);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.listen(3001, () => console.log('Servidor backend en http://localhost:3001'));
