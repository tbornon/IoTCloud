const mongoose = require('mongoose');

// On s'assure que tous les arguments ont correctement été passé afin de démarrer le process
if (process.argv.length < 3) {
    console.error("Usage : node min_between_dates.js [sensorId] [date1] [date2]")
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
        let from = process.argv[3] || new Date(0).toISOString();
        let to = process.argv[4] || Date().toISOString();
        
        return Data
            .find({
              sensorId: process.argv[2],
              date: {
                  $gte: from,
                  $lte: to
              }
            })
            .sort("+value")
            .limit(1)
            .exec();
    })
    .then(data => console.log(data))
    .catch(err => console.error(err));
