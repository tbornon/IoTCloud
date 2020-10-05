var amqp = require('amqplib/callback_api');
const credentials = require('./credentials');

const QUEUE_NAME = process.argv[2] + process.argv[3];

// On s'assure que tous les arguments ont correctement été passé afin de démarrer le process
if (process.argv.length < 4) {
	console.error("Usage : node producer.js [client_name] [building_name]")
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

		var msg = 'Hello world';

		// On s'assure que la queue existe et quelle est durable / sauvegarde les messages en cas d'arrêt de RabbitMQ
		// Si la queue n'existe pas, elle est créée
		// Si la queue existe mais qu'elle n'est pas durable, le programme s'arrête
		channel.assertQueue(QUEUE_NAME, {
			durable: true
		}, err => {
			if (err) {
				console.error(err);
				process.exit(-2);
			}
		});

		// On envoie un message dans la queue qui est sauvegardé en cas d'arrêt de RabbitMQ
		channel.sendToQueue(QUEUE_NAME, Buffer.from(msg), {
			persistent: true
		});
		console.log(" [x] Sent %s to %s", msg, QUEUE_NAME);
	});
});