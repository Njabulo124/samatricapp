const bcrypt = require('bcrypt');

async function testPasswordHashing() {
    const plainTextPassword = '@Mageba199S';
    const saltRounds = 10;

    // Hash the password
    const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);

    console.log('Plain Text Password:', plainTextPassword);
    console.log('Hashed Password:', hashedPassword);

    // Compare the plain text password with the hashed password
    const match = await bcrypt.compare(plainTextPassword, hashedPassword);
    console.log('Passwords match:', match); // Should print true
}

testPasswordHashing();