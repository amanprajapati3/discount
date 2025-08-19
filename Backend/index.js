// Express server for handling webhook
const express = require('express');
const app = express();
const axios = require('axios');

app.use(express.json());

const SHOPIFY_ACCESS_TOKEN =process.env.SHOPIFY_ACCESS_TOKEN ;
const SHOPIFY_STORE =process.env.SHOPIFY_STORE ;

app.post('/generate-discount', async (req, res) => {
  const customerId = req.body.customer_id;

  const discountCode = `WELCOME-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  try {
    // Create Discount Code
    const discount = await axios.post(
      `https://${SHOPIFY_STORE}/admin/api/2023-07/discount_codes.json`,
      {
        discount_code: {
          code: discountCode,
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    // Save Code in Customer Metafield
    await axios.put(
      `https://${SHOPIFY_STORE}/admin/api/2023-07/customers/${customerId}/metafields.json`,
      {
        metafield: {
          namespace: 'custom',
          key: 'unique_discount_code',
          value: discountCode,
          type: 'single_line_text_field',
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).send('Discount code created and saved');
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Error creating discount');
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
