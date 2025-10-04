const bcrypt = require('bcrypt'); // Make sure you have bcrypt installed in your project

async function generateHashedPassword() {
    const password = 'admin123'; // The password you want to hash
    const saltRounds = 10; // Standard salt rounds, match what your app usually uses

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('Generated Hashed Password:');
        console.log(hashedPassword);
        console.log('\nCopy this entire string to insert into MongoDB.');
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}

generateHashedPassword();