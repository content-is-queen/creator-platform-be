// controllers/paymentController.js
const stripe = require('stripe')('sk_test_51PEYUjA0tTttcwfyvnIjHg1BxxxYr1pNtClrkA2UBhfWV6wBW3xcpjMgGEyl4VjrlDH9Xnsf2oz7VWnIoMW2ylba00GKhqrB3g'); // Make sure to set your Stripe secret key in your environment variables

/**
 * Create a subscription for a customer.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */

const createSubscription = async (req, res) => {
    console.log(' is this being called')
    const { email, paymentMethodId, priceId } = req.body;
  
    try {
      let customer;
  
      // Check if customer already exists with the provided email
      const existingCustomers = await stripe.customers.list({ email: email });
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        // Create a new customer if not found
        customer = await stripe.customers.create({
          email: email,
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }
  
      // Attach the payment method to the customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });
  
      // Update customer's default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
  
      // Create a subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        expand: ['latest_invoice.payment_intent'],
      });
  
      // Respond with the subscription details
      res.status(200).json(subscription);
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(400).json({ error: { message: error.message } });
    }
  };


  const createCustomer = async (req, res) => {
    try {
        // Create a new customer using the email provided in the request body
        const customer = await stripe.customers.create({
            email: req.body.email,
        });

        // Respond with the newly created customer object
        res.status(200).json({ customer });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: { message: 'An error occurred while creating the customer.' } });
    }
};

const createPaymentMethod = async (req, res) => {
    const { cardNumber, expMonth, expYear, cvc } = req.body;

    try {
        // Create a payment method using the provided card details
        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: {
                number: cardNumber,
                exp_month: expMonth,
                exp_year: expYear,
                cvc: cvc,
            },
        });

        // Respond with the newly created payment method object
        res.status(200).json({ paymentMethod });
    } catch (error) {
        console.error('Error creating payment method:', error);
        res.status(500).json({ error: { message: 'An error occurred while creating the payment method.' } });
    }
};


module.exports = {
  createSubscription,createCustomer,createPaymentMethod
};

