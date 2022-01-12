import mongoose, { Schema } from 'mongoose';

const reqString = {
    type: String,
    required: true,
};

const pingSchema = new Schema({
    _id: reqString, // Guild ID
    channelId: reqString,
});

const name = 'ping-channels';

export default mongoose.models[name] || mongoose.model(name, pingSchema, name);
