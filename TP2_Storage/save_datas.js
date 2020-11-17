const mongoose = require('mongoose');
const amqp = require('amqplib');
const credentials = require('./credentials');

const QUEUE_NAME = process.argv[2] + "." + process.argv[3];
const PREFETCH_VALUE = 10;

// On s'assure que tous les arguments ont correctement été passé afin de démarrer le process
if (process.argv.length < 4) {
    console.error("Usage : node save_datas.js [client_name] [building_name]")
    process.exit(-1);
}

const DataSchema = new mongoose.Schema({
    sensorId: String,
    date: Date,
    value: String
})

const Data = mongoose.model('Data', DataSchema);

let mongoDBPromise = mongoose.connect("mongodb://localhost:27017/iotcloud", { useNewUrlParser: true, useUnifiedTopology: true });
let amqpPromise = amqp.connect(`amqp://${credentials.username}:${credentials.password}@localhost`);

Promise.all([mongoDBPromise, amqpPromise])
    .then(([, amqpConnection]) => {
        return amqpConnection.createChannel()
    })
    .then(channel => {
        // On s'assure que la queue existe et quelle est durable / sauvegarde les messages en cas d'arrêt de RabbitMQ
        // Si la queue n'existe pas, elle est créée
        // Si la queue existe mais qu'elle n'est pas durable, le programme s'arrête
        channel.assertQueue(QUEUE_NAME, {
            durable: true
        }).
            then(() => {
                // Nombre de message maximum que la queue reçoit à la fois
                channel.prefetch(PREFETCH_VALUE);

                console.log(" [*] Waiting for messages in \"%s\". To exit press CTRL+C", QUEUE_NAME);

                return channel.consume(QUEUE_NAME, function (msg) {
                    let msgContent = JSON.parse(msg.content.toString());
                    // On sauvegarde la data reçue
                    Data.create({date: Date(msgContent.DATE), sensorId: msgContent.SENSOR, value: msgContent.VALUE});
                    // On confirme au serveur que le message a correctement été traité
                    channel.ack(msg);
                }, {
                    // manual acknowledgment mode,
                    // see https://www.rabbitmq.com/confirms.html for details
                    noAck: false
                });
            })
            .catch(err => {
                console.error(err);
                process.exit(-2);
            });
    })
    .catch(err => {
        console.error(err);
        process.exit(-2);
    });