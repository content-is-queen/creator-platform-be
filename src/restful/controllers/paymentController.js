const stripe = require('stripe')('sk_test_your_secret_key_here'); // Replace with your secret key

const createSubscription = async (req, res) => {
    try {
        const { customerId, priceId } = req.body;
        
        if (!customerId || !priceId) {
            return res.status(400).send({ error: 'Customer ID and Price ID are required.' });
        }
    
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
        });
    
        res.status(200).send({
            subscriptionId: subscription.id,
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).send({
            error: error.message,
        });
    }
};

module.exports = {
    createSubscription,
};
