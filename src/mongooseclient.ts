import mongoose from "mongoose"
export const dbclient = await mongoose.connect('mongodb+srv://mongoose:mongoose@cluster0.azssq.mongodb.net/', { dbName: "SohbetTakil" });
