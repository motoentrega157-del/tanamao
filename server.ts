import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

// PagBank Payment Endpoint
// Example Request (Crie e pague o pedido com Pix/QR Code):
// POST /api/payments/create
// {
//   "deliveryId": "DEL-123",
//   "amount": 15.50,
//   "customer": {
//     "name": "João Silva",
//     "email": "joao@email.com",
//     "tax_id": "12345678909"
//   }
// }
//
// Example Response from PagBank:
// {
//   "id": "ORDE_123456789",
//   "reference_id": "DEL-123",
//   "qr_codes": [
//     {
//       "id": "QRCO_123456789",
//       "amount": { "value": 1550 },
//       "links": [
//         { "rel": "QRCODE.PNG", "href": "https://..." }
//       ]
//     }
//   ]
// }
app.post("/api/payments/create", async (req, res) => {
  const { deliveryId, amount, customer } = req.body;
  
  try {
    const response = await axios.post(
      `${process.env.PAGBANK_API_URL}/orders`,
      {
        reference_id: deliveryId,
        customer: {
          name: customer?.name || "Cliente TaNaMao",
          email: customer?.email || "cliente@tanamao.com",
          tax_id: customer?.tax_id || "00000000000"
        },
        items: [
          {
            reference_id: "DELIVERY_FEE",
            name: "Taxa de Entrega TaNaMao",
            quantity: 1,
            unit_amount: Math.round(amount * 100) // PagBank uses cents
          }
        ],
        qr_codes: [
          {
            amount: {
              value: Math.round(amount * 100)
            }
          }
        ],
        notification_urls: [`${process.env.APP_URL}/api/payments/webhook`]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAGBANK_API_KEY}`,
          "Content-Type": "application/json",
          "x-pagseguro-version": "3.0"
        }
      }
    );
    res.json(response.data);
  } catch (error: any) {
    console.error("PagBank Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to create payment" });
  }
});

  // PagBank Webhook Endpoint
  app.post("/api/payments/webhook", (req, res) => {
    console.log("PagBank Webhook received:", req.body);
    // Process webhook logic here
    res.status(200).send("OK");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
