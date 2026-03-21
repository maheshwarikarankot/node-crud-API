import Fastify from 'fastify';

const fastify = new Fastify({logger: true});
const PORT = process.env.PORT || 3000;

fastify.get('/', async (request, reply) => {
    return { message: 'Welcome to product API!' };
});


const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`Server is running on port ${PORT}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();