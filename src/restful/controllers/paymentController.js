// controllers/paymentController.js

const stripe = require("stripe")(process.env.SK_TEST); // Make sure to set your Stripe secret key in your environment variables

/**
 * Create a subscription for a customer.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */

const createCheckoutSession = async (req, res) => {
  const origin = req.headers.origin || "http://localhost:3000"; // Default to localhost if origin is not set
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1PLO1XA0tTttcwfynID8uLdO", // Use the specific price ID
          quantity: 1,
        },
      ],
      mode: "subscription", // Or 'payment' for one-time payments
      success_url: `${origin}/plus?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/plus`,
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session backend:", error);
    res.status(500).json({
      error: {
        message: "An error occurred while creating the checkout session.",
      },
    });
  }
};

module.exports = { createCheckoutSession };
