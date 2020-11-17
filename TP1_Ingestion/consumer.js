var amqp = require('amqplib/callback_api');
const credentials = require('./credentials');

const QUEUE_NAME = process.argv[2] + "." + process.argv[3];
const PREFETCH_VALUE = 10;

// On s'assure que tous les arguments ont correctement été passé afin de démarrer le process
if (process.argv.length < 4) {
    console.error("Usage : node consumer.js [client_name] [building_name]")
    process.exit(-1);
}

// Connexion à RabbitMQ
amqp.connect(`amqp://${credentials.username}:${credentials.password}@localhost`, function (error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }

        // On s'assure que la queue existe et quelle est durable / sauvegarde les messages en cas d'arrêt de RabbitMQ
        // Si la queue n'existe pas, elle est créée
        // Si la queue existe mais qu'elle n'est pas durable, le programme s'arrête
        channel.assertQueue(QUEUE_NAME, {
            durable: true
        }, err => {
            if(err) {
                console.error(err);
                process.exit(-2);
            }
        });

        // Nombre de message maximum que la queue reçoit à la fois
        channel.prefetch(PREFETCH_VALUE);

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", QUEUE_NAME);

        channel.consume(QUEUE_NAME, function (msg) {
            console.log(" [x] Received %s", msg.content.toString());
            // On confirme au serveur que le message a correctement été traité
            channel.ack(msg);
        }, {
            // manual acknowledgment mode,
            // see https://www.rabbitmq.com/confirms.html for details
            noAck: false
        });
    });
});
