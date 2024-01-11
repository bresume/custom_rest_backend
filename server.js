const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken'); // For JSON Web Token (JWT) authentication
const bcrypt = require('bcrypt'); // For password hashing
const app = express();
const port = 3000;

// Middleware to parse JSON in the request body
app.use(bodyParser.json());

// Sample data (replace with your own data handling logic)
let players = [];

// Sample user data for authentication (replace with your own user management logic)
const users = [
    { username: 'admin', password: '$2b$10$YITCrKfRi/sUQ1Co0nFUpu1myyJctKlSHkLXV4joBs4dqhbgZMU/O' } // Hashed password for 'password'
];
// Sample registration store (replace with your actual data store)
const registeredFunctions = {
    // Function details stored here dynamically
    // Example: 'functionName': { endpoint: 'https://your-azure-function-url/api/your-function' }
};

// Middleware for authentication using JSON Web Tokens (JWT)
const authenticate = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, 'your-secret-key'); // Replace with a strong secret key
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Register a new function dynamically
app.post('/registerFunction', (req, res) => {
    const { functionName, endpoint } = req.body;

    registeredFunctions[functionName] = { endpoint };
    res.json({ message: 'Function registered successfully' });
});

// Invoke a registered function dynamically
app.post('/invokeFunction/:functionName', async (req, res) => {
    const { functionName } = req.params;
    const functionDetails = registeredFunctions[functionName];

    if (!functionDetails) {
        return res.status(404).json({ message: 'Function not found' });
    }

    try {
        const response = await axios.post(functionDetails.endpoint, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to register a new user (sign-up)
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the username is already taken
        if (users.find(user => user.username === username)) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Add the new user
        users.push({ username, password: hashedPassword });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to authenticate a user and obtain a JWT token (login)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the user by username
        const user = users.find(user => user.username === username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate a JWT token
        const token = jwt.sign({ user: { username } }, 'your-secret-key', { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Protected route - requires authentication
app.get('/api/players', authenticate, (req, res) => {
    res.json(players);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
