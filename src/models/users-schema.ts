import mongoose, { Schema } from 'mongoose';

const reqString = {
    type: String,
    required: true,
};

const usersSchema = new Schema({
    _id: reqString, // Guild ID
    usersId: [reqString],
});

const name = 'users-signed-up';

export default mongoose.models[name] || mongoose.model(name, usersSchema, name);
