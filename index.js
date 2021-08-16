const init = async () => {
    const dotenv = require('dotenv');
    dotenv.config();

    const Hapi = require('@hapi/hapi');

    const server = Hapi.server({
        port: process.env.PORT,
        host: process.env.HOST
    });

    const {linkRoutes} = require('./routes/link');
    const {testRoutes} = require('./routes/test');
    const {productRoutes} = require('./routes/product');
    const {routineRoutes} = require('./routes/routine');

    const routes = [
        ...linkRoutes,
        ...testRoutes,
        ...productRoutes,
        ...routineRoutes
    ];

    server.route(routes);

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();