/**
 * PagBank Integration Service
 * 
 * This service communicates with our backend to interact with PagBank APIs.
 * 
 * Example Request (Sent to our backend):
 * POST /api/payments/create
 * {
 *   "deliveryId": "DEL-123",
 *   "amount": 12.50,
 *   "customer": {
 *     "name": "João Silva",
 *     "email": "joao@email.com",
 *     "tax_id": "12345678909"
 *   }
 * }
 * 
 * Example Response (Received from our backend/PagBank):
 * {
 *   "id": "ORDE_123456789",
 *   "reference_id": "DEL-123",
 *   "qr_codes": [
 *     {
 *       "id": "QRCO_123456789",
 *       "amount": { "value": 1250 },
 *       "links": [
 *         { "rel": "QRCODE.PNG", "href": "https://..." },
 *         { "rel": "QRCODE.TEXT", "href": "..." }
 *       ]
 *     }
 *   ]
 * }
 */

export interface PagBankOrderResponse {
  id: string;
  reference_id: string;
  qr_codes?: Array<{
    id: string;
    amount: { value: number };
    links: Array<{ rel: string; href: string }>;
  }>;
}

export const createPagBankOrder = async (deliveryId: string, amount: number, customer: { name: string, email: string, tax_id: string }): Promise<PagBankOrderResponse> => {
  const response = await fetch('/api/payments/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deliveryId,
      amount,
      customer
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create PagBank order');
  }

  return response.json();
};
