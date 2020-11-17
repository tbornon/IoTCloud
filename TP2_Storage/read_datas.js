const mongoose = require('mongoose');

// On s'assure que tous les arguments ont correctement été passé afin de démarrer le process
if (process.argv.length < 3) {
    console.error("Usage : node read_data.js [sensorId] [page]")
    process.exit(-1);
}

const DataSchema = new mongoose.Schema({
    sensorId: String,
    date: Date,
    value: String
})

const Data = mongoose.model('Data', DataSchema);
mongoose.connect("mongodb://localhost:27017/iotcloud", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        let page = process.argv[3] || 0;
        return Data
            .find({sensorId: process.argv[2]})
            .sort("-date")
            .limit(10)
            .skip(10 * page)
            .exec();
    })
    .then(data => console.log(data))
    .catch(err => console.error(err));
