module.exports = async function (context, req) {
    context.log('Hello function processed a request.');

    const name = req.query.name || 'World';

    context.res = {
        status: 200,
        body: { message: `Hello, ${name}!`, timestamp: new Date().toISOString() }
    };
};
