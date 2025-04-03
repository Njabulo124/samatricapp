// Function to show home page
function showHomePage() {
    document.getElementById('home').style.display = 'block';
    document.getElementById('stream-info').style.display = 'none';
    document.getElementById('bursaries-info').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
}

// Function to show streams info
function viewStreams() {
    document.getElementById('home').style.display = 'none';
    document.getElementById('stream-info').style.display = 'block';
    document.getElementById('bursaries-info').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
}

// Function to show bursaries info
function viewBursaries() {
    document.getElementById('home').style.display = 'none';
    document.getElementById('stream-info').style.display = 'none';
    document.getElementById('bursaries-info').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

// Function to show register form
function showRegisterForm() {
    document.getElementById('home').style.display = 'none';
    document.getElementById('stream-info').style.display = 'none';
    document.getElementById('bursaries-info').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('formTitle').textContent = 'Register Form';
    document.getElementById('toggleLink').textContent = 'Already have an account? Login';
}

// Toggling between signup and login forms
document.getElementById('toggleLink').addEventListener('click', function(e) {
    e.preventDefault();
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const formTitle = document.getElementById('formTitle');

    if (signupForm.style.display === 'none') {
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
        formTitle.textContent = 'Register Form';
        this.textContent = 'Already have an account? Login';
    } else {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        formTitle.textContent = 'Login Form';
        this.textContent = "Don't have an account? Register";
    }
});

// Allowed email domains
const allowedDomains = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", 
    "icloud.com", "live.com", "aol.com", "zoho.com", 
    "mail.com", "protonmail.com"
];

// Register form submission
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const surname = document.getElementById('surname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Extract the email domain
    const emailDomain = email.substring(email.lastIndexOf("@") + 1).toLowerCase().trim();

    // Check if the domain is allowed
    if (!allowedDomains.includes(emailDomain)) {
        document.getElementById('message').innerHTML = `<p class="error">Error: The email domain '${emailDomain}' is not allowed. Please use a valid domain.</p>`;
        return;  // Prevent further execution if domain is invalid
    }

    // Proceed with the signup request if the domain is valid
    fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, surname, email, password })
    })
    .then(response => response.json())
    .then(data => {
        // Display the success message
        document.getElementById('message').innerHTML = `<p class="success">${data.message}</p>`;
        
        // Clear the signup form fields
        document.getElementById('signupForm').reset();

        // Redirect to the login section after a short delay to show the message
        setTimeout(() => {
            // Clear the message after a delay
            document.getElementById('message').innerHTML = '';

            // Show the login section and hide the registration section
            document.getElementById('loginSection').style.display = 'block';  // Ensure you have an element with this ID
            document.getElementById('signupSection').style.display = 'none';  // Ensure you have an element with this ID
        }, 2000); // Delay of 2000 milliseconds (2 seconds)
    })
    .catch(error => {
        document.getElementById('message').innerHTML = `<p class="error">Error: ${error.message}</p>`;
        console.error('Error:', error);
    });
});

// Login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Login successful!') {
            // Store the user's email in localStorage
            localStorage.setItem('userEmail', email);
            // Redirect to add_subject.html on successful login
            window.location.href = 'add_subject.html';
        } else if (data.message === 'Account not found!') {
            // Show error message and redirect to signup
            document.getElementById('message').innerHTML = `<p class="error">${data.message}</p>`;
            setTimeout(() => {
                document.getElementById('message').innerHTML = ''; // Clear the message
                document.getElementById('signupSection').style.display = 'block'; // Show the signup section
                document.getElementById('loginSection').style.display = 'none'; // Hide the login section
            }, 1000000); // Adjust the delay if needed
        } else {
            document.getElementById('message').innerHTML = `<p class="error">${data.message}</p>`;
        }
        
        // Clear the message and reload the page if needed
        setTimeout(() => {
            document.getElementById('message').innerHTML = ''; // Clear the message
        }, 2000); // Adjust the delay if needed
    })
    .catch(error => {
        document.getElementById('message').innerHTML = `<p class="error">Error: ${error.message}</p>`;
        console.error('Error:', error);
    });
});

// Add subject form submission (if this page exists in your application)
if (document.getElementById('addSubjectForm')) {
    document.getElementById('addSubjectForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const subjectName = document.getElementById('subjectName').value;
        const subjectMarks = document.getElementById('subjectMarks').value;

        fetch('http://localhost:5000/addSubjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subjectName, subjectMarks })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => { throw new Error(data.message); });
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('message').innerHTML = `<p class="success">${data.message}</p>`;
        })
        .catch(error => {
            document.getElementById('message').innerHTML = `<p class="error">Error: ${error.message}</p>`;
            console.error('Error:', error);
        });
    });
}

function returnToHome() {
    showHomePage();
}

window.onload = showHomePage;