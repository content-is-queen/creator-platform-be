const stripe = require('stripe')('rk_test_51PEYUjA0tTttcwfy68vzV9o31xyP7m1SFLnhWbUVmgD6snDwaEPTyroswitGAKhysvCO8hr3NRwpvB7Zxf3IKMbS00WFZaCH12');

const createPaymentIntent = async (req, res) => {
    try {
      const { amount, currency } = req.body;
      
      // Add input validation
      if (!amount || !currency) {
        return res.status(400).send({ error: 'Amount and currency are required.' });
      }
  
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
      });
  
      res.status(200).send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).send({
        error: error.message,
      });
    }
  };
  
  module.exports = {
    createPaymentIntent,
  };