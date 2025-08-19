// backend/api/generate-discount.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customer_id } = req.body;

  if (!customer_id) {
    return res.status(400).json({ error: 'Missing customer_id' });
  }

  const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
  const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

  const discountCode = `WELCOME-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  try {
    // Create discount code
    const discountRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-07/price_rules.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_rule: {
          title: discountCode,
          target_type: "line_item",
          target_selection: "all",
          allocation_method: "across",
          value_type: "percentage",
          value: "-10.0",
          customer_selection: "all",
          once_per_customer: true,
          usage_limit: 1,
          starts_at: new Date().toISOString()
        }
      }),
    });

    const priceRuleData = await discountRes.json();

    const priceRuleId = priceRuleData.price_rule.id;

    // Create actual discount code under the rule
    await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-07/price_rules/${priceRuleId}/discount_codes.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        discount_code: {
          code: discountCode
        }
      }),
    });

    // Save it to metafield
    await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-07/customers/${customer_id}/metafields.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metafield: {
          namespace: 'custom',
          key: 'unique_discount_code',
          value: discountCode,
          type: 'single_line_text_field'
        }
      })
    });

    res.status(200).json({ message: 'Discount code created and saved', code: discountCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create discount' });
  }
}
