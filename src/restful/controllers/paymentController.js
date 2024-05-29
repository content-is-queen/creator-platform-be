// controllers/paymentController.js
const stripe = require('stripe')('sk_test_51PEYUjA0tTttcwfyvnIjHg1BxxxYr1pNtClrkA2UBhfWV6wBW3xcpjMgGEyl4VjrlDH9Xnsf2oz7VWnIoMW2ylba00GKhqrB3g'); // Make sure to set your Stripe secret key in your environment variables

/**
 * Create a subscription for a customer.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */


const createCheckoutSession = async (req, res) => {
  const origin = req.headers.origin || 'http://localhost:3000'; // Default to localhost if origin is not set
  try {
      const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
              {
                  price: 'price_1PLO1XA0tTttcwfynID8uLdO', // Use the specific price ID
                  quantity: 1,
              },
          ],
          mode: 'subscription', // Or 'payment' for one-time payments
          success_url: `${origin}/checkout?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/checkout`,
      });

      res.status(200).json({ id: session.id });
  } catch (error) {
      console.error('Error creating checkout session backend:', error);
      res.status(500).json({ error: { message: 'An error occurred while creating the checkout session.' } });
  }
};


const createSubscription = async (req, res) => {
    const { email, paymentMethodId, priceId } = req.body;

    try {
        // Check if the customer already exists
        let customer = await getOrCreateCustomer(email, paymentMethodId);

        // Attach the payment method to the customer if not already attached
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id,
        });

        // Update customer's default payment method
        await stripe.customers.update(customer.id, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        // Create the subscription
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

/**
 * Helper function to get or create a customer.
 * @param {string} email - Customer email.
 * @param {string} paymentMethodId - Payment method ID.
 * @returns {object} - Customer object.
 */
const getOrCreateCustomer = async (email, paymentMethodId) => {
    // Check if customer already exists with the provided email
    const existingCustomers = await stripe.customers.list({ email });
    if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
    } else {
        // Create a new customer if not found
        return await stripe.customers.create({
            email,
            payment_method: paymentMethodId,
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
    }
};

/**
 * Create a customer.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
const createCustomer = async (req, res) => {
    try {
        const customer = await stripe.customers.create({
            email: req.body.email,
        });
        res.status(200).json({ customer });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: { message: 'An error occurred while creating the customer.' } });
    }
};

/**
 * Create a payment method.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
const createPaymentMethod = async (req, res) => {
    const { cardNumber, expMonth, expYear, cvc } = req.body;

    try {
        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: {
                number: cardNumber,
                exp_month: expMonth,
                exp_year: expYear,
                cvc: cvc,
            },
        });
        res.status(200).json({ paymentMethod });
    } catch (error) {
        console.error('Error creating payment method:', error);
        res.status(500).json({ error: { message: 'An error occurred while creating the payment method.' } });
    }
};

module.exports = {
    createSubscription,
    createCustomer,
    createPaymentMethod,
    createCheckoutSession
};
