const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const stripeRoutes = require('./routes/stripe');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', stripeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
