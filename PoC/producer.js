#!/usr/bin/node
var amqp = require('amqplib/callback_api');

const QUEUE_NAME = "mat_premiere";
const END_TIME = 1609920000000
const START_TIME = END_TIME - 604800000

var products = {
	soude: {
		qty: 100.00,
		temperature: 20.0,
		humidity: 15.0
	},
	graisse: {
		qty: 100.00,
		temperature: 20.0,
		humidity: 15.0
	},
	potassium: {
		qty: 100.00,
		temperature: 20.0,
		humidity: 15.0
	}
}

// Connexion à RabbitMQ
amqp.connect(`amqp://rabbitmq:rabbitmq@localhost`, function (error0, connection) {
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
			if (err) {
				console.error(err);
				process.exit(-2);
			}
		});

		for (let i = START_TIME; i < END_TIME; i += 300000) {
			let d = new Date(i);
			let msgs = []

			if (d.getHours() >= 8 && d.getHours() <= 19) {
				if (d.getHours() == 9 && d.getMinutes() == 0) {
					for (let product in products) {
						if (Math.round(Math.random() * 10) < 2)
							products[product].qty = 100.00
					}
				}

				for (let product in products) {
					products[product].qty -= Math.random() / 5
					products[product].qty = Math.max(0, products[product].qty);
					msgs.push({
						MEASURE: "volume",
						DATE: d.getTime(),
						SENSOR: product,
						VALUE: products[product].qty
					})
				}
			}

			for (let product in products) {
				products[product].humidity += Math.random() > 0.5 ? Math.random() * 1.03 : -Math.random();
				products[product].humidity = Math.max(0, products[product].humidity);
				products[product].humidity = Math.min(100, products[product].humidity);
				msgs.push({
					MEASURE: "humidity",
					DATE: d.getTime(),
					SENSOR: product,
					VALUE: products[product].humidity
				})
			}

			if(d.getHours()>= 9 && d.getHours() <= 17) {
				for (let product in products) {
					products[product].temperature += Math.random() > 0.8 ? Math.random() / 100 : -Math.random() / 100;
					products[product].temperature = Math.max(15, products[product].temperature);
					products[product].temperature = Math.min(25, products[product].temperature);
					msgs.push({
						MEASURE: "temperature",
						DATE: d.getTime(),
						SENSOR: product,
						VALUE: products[product].temperature
					})
				}
			}
			else {
				for (let product in products) {
					products[product].temperature -= Math.random() > 0.8 ? Math.random() / 100 : -Math.random() / 100;
					products[product].temperature = Math.max(15, products[product].temperature);
					products[product].temperature = Math.min(25, products[product].temperature);
					msgs.push({
						MEASURE: "temperature",
						DATE: d.getTime(),
						SENSOR: product,
						VALUE: products[product].temperature
					})
				}
			}

			for (let i = 0; i < msgs.length; i++) {
				// On envoie un message dans la queue qui est sauvegardé en cas d'arrêt de RabbitMQ
				channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(msgs[i])), {
					persistent: true
				});
			}
		}
	});
});