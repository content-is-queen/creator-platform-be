// controllers/paymentController.js

const stripe = require("stripe")(process.env.SK_TEST); // Make sure to set your Stripe secret key in your environment variables
const admin = require("firebase-admin");

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
      success_url: `${origin}/thankyou?session_id={CHECKOUT_SESSION_ID}`,
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

const cancelSubscription = async (req, res) => {
  const { user_id } = req.body;
  const db = admin.firestore();

  try {
    // Get the user's subscription ID from Firestore
    const userDoc = await db.collection("users").doc(user_id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const { subscriptionId } = userDoc.data();
    if (!subscriptionId) {
      return res.status(400).json({ error: "No subscription found for user" });
    }

    // Cancel the subscription using Stripe API
    const cancellation = await stripe.subscriptions.cancel(subscriptionId);

    // Update the user's subscription status in Firestore
    await db
      .collection("users")
      .doc(user_id)
      .update({ subscribed: false, subscriptionId: null });

    res
      .status(200)
      .json({ message: "Subscription cancelled successfully", cancellation });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({
      error: {
        message: "An error occurred while canceling the subscription.",
      },
    });
  }
};

const subscribeUser = async (req, res) => {
  const { session_id, user_id } = req.body;
  const db = admin.firestore();

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.status === "complete") {
      // Update user to subscribed if session payment shows as complete
      db.collection("users").doc(user_id).update({ subscribed: true });
    }
    res.status(200).json({ session });
  } catch (error) {
    res.status(500).json({
      error: {
        message: "Something went wrong when retrieving the session",
      },
    });
  }
};

module.exports = { createCheckoutSession, subscribeUser, cancelSubscription };
