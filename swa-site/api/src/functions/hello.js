const { app } = require('@azure/functions');

app.http('hello', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Hello function processed a request.');

        const name = request.query.get('name') || 'World';

        return {
            status: 200,
            jsonBody: {
                message: `Hello, ${name}!`,
                timestamp: new Date().toISOString()
            }
        };
    }
});
