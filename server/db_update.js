const mongoose = require('mongoose');
require('dotenv').config();

const Question = require('./models/Question');

async function runUpdate() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/recruitment_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // 1. Normalize type and company to lowercase
    const questions = await Question.find({});
    console.log(`Found ${questions.length} total questions in database.`);

    let updatedCount = 0;
    for (const q of questions) {
      let changed = false;
      
      if (q.type && q.type !== q.type.toLowerCase()) {
        q.type = q.type.toLowerCase();
        changed = true;
      }
      
      if (!q.company) {
        q.company = 'none';
        changed = true;
      } else if (q.company !== q.company.toLowerCase()) {
        q.company = q.company.toLowerCase();
        changed = true;
      }

      if (changed) {
        try {
          await q.save();
          updatedCount++;
        } catch (saveError) {
          console.error(`Failed to save question ${q._id}:`, saveError.message);
        }
      }
    }

    console.log(`Updated ${updatedCount} questions for consistency (lowercase type/company).`);

    // 2. Explicitly force 'Aptitude' -> 'aptitude' just in case
    const forceResult = await Question.updateMany(
      { type: { $regex: /^aptitude$/i } },
      { $set: { type: 'aptitude' } }
    );
    console.log(`Forced 'aptitude' type normalization on ${forceResult.modifiedCount} documents.`);

    console.log('Database updation completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
}

runUpdate();
