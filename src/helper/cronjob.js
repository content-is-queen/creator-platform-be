import cron from 'node-cron';

export const cronJob = () => {
    cron.schedule('* * * * *', () => {
        console.log('hello from node cron utils ..............');
    });
};
