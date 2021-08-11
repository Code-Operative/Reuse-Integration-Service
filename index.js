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

    const routes = [
        ...linkRoutes,
        ...testRoutes
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