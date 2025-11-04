// scripts/check-schema.js
const mongoose = require('mongoose');
require('dotenv').config();

async function checkSchema() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saekindex');
    console.log('✅ Connected to MongoDB');

    const docs = await mongoose.connection.db.collection('surveys').find({}).toArray();
    console.log(`📊 Total documents: ${docs.length}\n`);

    docs.forEach((doc, i) => {
      console.log(`📄 Document ${i+1} (ID: ${doc._id}):`);
      Object.keys(doc).forEach(key => {
        const value = doc[key];
        const type = typeof value;
        const displayValue = Array.isArray(value) ? `[Array: ${value.join(', ')}]` : 
                           type === 'object' && value !== null ? '[Object]' : 
                           String(value);
        console.log(`  ${key}: ${type} = ${displayValue}`);
      });
      console.log('');
    });

    // 스키마 불일치 검사
    console.log('🔍 Schema validation check:');
    const schemaIssues = [];
    
    docs.forEach((doc, i) => {
      // question1-8이 숫자가 아닌 경우 체크
      for (let q = 1; q <= 8; q++) {
        const field = `question${q}`;
        if (doc[field] !== undefined) {
          if (Array.isArray(doc[field])) {
            schemaIssues.push(`Document ${i+1}: ${field} is array instead of number`);
          } else if (typeof doc[field] === 'string') {
            schemaIssues.push(`Document ${i+1}: ${field} is string instead of number`);
          } else if (typeof doc[field] !== 'number') {
            schemaIssues.push(`Document ${i+1}: ${field} is ${typeof doc[field]} instead of number`);
          }
        }
      }
    });

    if (schemaIssues.length > 0) {
      console.log('❌ Schema issues found:');
      schemaIssues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ All documents match expected schema');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

checkSchema();