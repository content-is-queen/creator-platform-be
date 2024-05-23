const stripe = require('stripe')('rk_test_51PEYUjA0tTttcwfy68vzV9o31xyP7m1SFLnhWbUVmgD6snDwaEPTyroswitGAKhysvCO8hr3NRwpvB7Zxf3IKMbS00WFZaCH12'); // Replace with your secret key

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
