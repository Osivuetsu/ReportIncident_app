const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    reporter: { type: String, required: true },
    image: { type: String }, // Store image URL or file path
    date: { type: Date, default: Date.now }
});

const Incident = mongoose.model("Incident", incidentSchema);
module.exports = Incident;
