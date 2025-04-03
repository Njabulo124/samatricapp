const express = require('express');
const mysql = require('mysql2/promise'); // Use promise-based MySQL
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

// Create an Express application
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json()); // Parse JSON requests

// MySQL database connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'capaciti', // Replace with your actual MySQL password
    database: 'samatricapp',
});

// Signup route
app.post('/signup', async (req, res) => {
    const { name, surname, email, password } = req.body;

    try {
        // Check if the user already exists
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) return res.status(400).json({ message: 'User already exists' });

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the database
        await db.query('INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)', 
        [name, surname, email, hashedPassword]);
        
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'An error occurred while registering the user' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (results.length === 0) return res.status(400).json({ message: 'NO ACCOUNT ASSOCIATED WITH THIS EMAIL PLEASE REGISTER' });

        const user = results[0];

        // Compare hashed password with the provided password
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.status(200).json({ message: 'Login successful!' });
        } else {
            res.status(400).json({ message: 'Incorrect credentials' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Get user ID route
app.get('/getUserId', async (req, res) => {
    const email = req.query.email; // Get the email from the query string

    try {
        const [results] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (results.length > 0) {
            res.json({ userId: results[0].id }); // Respond with the userId
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error fetching user ID:', err);
        return res.status(500).json({ message: 'Internal Server Error' }); // Send a 500 response on error
    }
});

// Get all subjects
app.get('/get-subjects', async (req, res) => {
    try {
        const [results] = await db.query('SELECT id, name FROM subjects');
        if (results.length === 0) return res.status(404).json({ message: 'No subjects found' });

        res.json(results);
    } catch (err) {
        return res.status(500).json({ error: err });
    }
});

// Add or update marks
app.post('/addMarks', async (req, res) => {
    const { subjectId, marks } = req.body;
    const userEmail = req.headers['user-email'];

    const query = `
        INSERT INTO user_marks (user_id, subject_id, marks)
        VALUES ((SELECT id FROM users WHERE email = ?), ?, ?)
        ON DUPLICATE KEY UPDATE marks = ?;
    `;

    try {
        await db.query(query, [userEmail, subjectId, marks, marks]);
        res.json({ message: 'Marks successfully added/updated!' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Get user marks by email
app.get('/get-marks', async (req, res) => {
    const userEmail = req.query.email;

    const query = `
        SELECT user_marks.subject_id, subjects.name AS subject_name, user_marks.marks 
        FROM user_marks
        JOIN subjects ON user_marks.subject_id = subjects.id
        JOIN users ON users.id = user_marks.user_id
        WHERE users.email = ?;
    `;

    try {
        const [results] = await db.query(query, [userEmail]);
        if (results.length === 0) return res.status(404).json({ message: 'No subjects or marks found for this user.' });

        console.log('Marks data fetched from DB:', results); // Log the fetched data
        res.json(results);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Delete marks
app.delete('/deleteMarks', async (req, res) => {
    console.log('Delete request received:', req.body, req.headers['user-email']);
    const subjectId = req.body.subjectId;
    const userEmail = req.headers['user-email'];

    // Input validation
    if (!subjectId || !userEmail) {
        return res.status(400).json({ message: 'Subject ID and user email are required.' });
    }

    // Validate subjectId
    if (subjectId === 'undefined' || isNaN(parseInt(subjectId))) {
        return res.status(400).json({ message: 'Invalid subject ID.' });
    }

    const deleteQuery = `
        DELETE FROM user_marks
        WHERE user_id = (SELECT id FROM users WHERE email = ?)
        AND subject_id = ?;
    `;

    try {
        const [result] = await db.query(deleteQuery, [userEmail, parseInt(subjectId)]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No matching subject found for deletion.' });
        }

        console.log('Delete result:', result);
        res.json({ message: 'Subject successfully deleted!' });
    } catch (err) {
        console.error('Error in delete query:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Get eligible courses
app.get('/api/eligible-courses/:userId', async (req, res) => {
    const userId = req.params.userId;

    const query = `
        WITH student_subjects AS (
            SELECT 
                um.subject_id,
                um.marks,
                CASE
                    -- Special rule for Life Orientation (subject_id = 43)
                    WHEN um.subject_id = 43 AND um.marks >= 80 THEN 1
                    WHEN um.subject_id = 43 AND um.marks < 80 THEN 0
                    -- Normal APS calculation for other subjects
                    WHEN um.marks >= 80 THEN 7
                    WHEN um.marks >= 70 THEN 6
                    WHEN um.marks >= 60 THEN 5
                    WHEN um.marks >= 50 THEN 4
                    WHEN um.marks >= 40 THEN 3
                    WHEN um.marks >= 30 THEN 2
                    ELSE 1
                END AS aps_points
            FROM 
                user_marks um
            WHERE 
                um.user_id = ?  -- Using parameter for userId
        ),
        student_aps AS (
            SELECT 
                SUM(aps_points) AS total_aps
            FROM 
                student_subjects
        ),
        course_eligibility AS (
            SELECT 
                c.course_id,
                c.course_name,
                u.university_name,
                c.min_aps_score,
                sa.total_aps,
                CASE 
                    WHEN sa.total_aps >= c.min_aps_score THEN 1
                    ELSE 0
                END AS meets_aps_requirement,
                COALESCE(
                    MIN(
                        CASE 
                            WHEN cr.key_subject = 1 AND ss.marks >= cr.min_mark THEN 1
                            WHEN cr.key_subject = 1 AND (ss.marks IS NULL OR ss.marks < cr.min_mark) THEN 0
                            ELSE NULL
                        END
                    ),
                    1
                ) AS meets_compulsory_requirements
            FROM 
                courses c
            JOIN 
                universities u ON c.university_id = u.university_id
            CROSS JOIN 
                student_aps sa
            LEFT JOIN 
                course_requirements cr ON c.course_id = cr.course_id
            LEFT JOIN 
                student_subjects ss ON cr.subject_id = ss.subject_id
            GROUP BY 
                c.course_id, 
                c.course_name, 
                u.university_name, 
                c.min_aps_score, 
                sa.total_aps
        )
        SELECT
            course_id,
            course_name,
            university_name,
            min_aps_score,
            total_aps,
            meets_aps_requirement,
            meets_compulsory_requirements
        FROM 
            course_eligibility
        WHERE 
            meets_aps_requirement = 1 AND meets_compulsory_requirements = 1;
    `;

    try {
        const [rows] = await db.query(query, [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No eligible courses found for the user.' });
        }

        res.json(rows);
    } catch (err) {
        console.error('Error fetching eligible courses:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

