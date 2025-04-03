document.addEventListener('DOMContentLoaded', function () {
    const addMarksForm = document.getElementById('addMarksForm');
    const subjectSelect = document.getElementById('subjectSelect');
    const subjectMarks = document.getElementById('subjectMarks');
    const subjectList = document.getElementById('subjectList');
    let userEmail = localStorage.getItem('userEmail');
    let userName = localStorage.getItem('userName');
    let userId = localStorage.getItem('userId');

    console.log('Initial userId:', userId);

    async function fetchUserId(email) {
        console.log('Fetching user ID for email:', email);
        try {
            const response = await fetch(`http://localhost:5000/getUserId?email=${email}`);
            if (!response.ok) {
                throw new Error('Failed to fetch user ID');
            }
            const data = await response.json();
            userId = data.userId;
            localStorage.setItem('userId', userId);
            console.log('Fetched userId:', userId);
            return userId;
        } catch (error) {
            console.error('Error fetching user ID:', error);
            showMessage('Error fetching user ID. Please log in again.', 'error');
            return null;
        }
    }

    async function ensureUserId() {
        userEmail = localStorage.getItem('userEmail'); // Refresh email
        if (!userId || userEmail !== localStorage.getItem('lastLoggedInEmail')) {
            userId = await fetchUserId(userEmail);
            if (userId) {
                localStorage.setItem('lastLoggedInEmail', userEmail);
            }
        }
        return userId;
    }

    // Initialize the page
    async function initPage() {
        await ensureUserId();
        userName = localStorage.getItem('userName'); // Refresh username
        document.getElementById('userName').innerText = userName || 'User';
        fetchSubjects();
        fetchSubjectMarks();
    }

    // Call initPage when the page loads and after login
    initPage();

    // Add a login function (this is a mock function, replace with your actual login logic)
    async function login(email, password) {
        // Perform login logic here
        // If login is successful:
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', 'User Name'); // Set the actual user name
        localStorage.removeItem('userId'); // Clear the old userId
        userId = null; // Reset userId in memory
        await initPage(); // Re-initialize the page with new user data
    }
   
    // Add logout function
    function logout() {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        localStorage.removeItem('lastLoggedInEmail');
        userId = null;
        location.reload(); // Reload the page to reset the state
    }

    addMarksForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const currentUserId = await ensureUserId();
        if (!currentUserId) {
            showMessage('User ID is not set. Please log in again.', 'error');
            return;
        }
        const subjectId = subjectSelect.value;
        const enteredMarks = subjectMarks.value;

        if (!subjectId || !enteredMarks) {
            showMessage('Please select a subject and enter marks.', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/addMarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-email': userEmail
                },
                body: JSON.stringify({ subjectId, marks: enteredMarks, userId: currentUserId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            showMessage('Marks submitted successfully!', 'success');
            fetchSubjectMarks();
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    });

    document.getElementById('searchCoursesButton').addEventListener('click', async () => {
        console.log("Search Courses Button Clicked");
        const currentUserId = await ensureUserId();
        console.log("User ID:", currentUserId);

        if (!currentUserId) {
            showMessage('User ID is not set. Please log in again.', 'error');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/eligible-courses/${currentUserId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch eligible courses');
            }

            const eligibleCourses = await response.json();
            localStorage.setItem('eligibleCourses', JSON.stringify(eligibleCourses));
            displayCourses(eligibleCourses);
            showMessage('Courses fetched successfully!', 'success');
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    });

    function displayQualifiedCoursesCount(count) {
        const qualifiedCoursesCount = document.getElementById('qualifiedCoursesCount');
        qualifiedCoursesCount.innerHTML = `You qualify for ${count} courses.`;
    }
    document.getElementById('showResultsButton').addEventListener('click', () => {
        window.location.href = 'results.html';
    });



    function fetchSubjects() {
        fetch(`http://localhost:5000/get-subjects?email=${userEmail}`)
            .then(response => response.json())
            .then(subjects => {
                subjectSelect.innerHTML = '';
                subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.id;
                    option.textContent = subject.name;
                    subjectSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error fetching subjects:', error);
                //showMessage(`Error fetching subjects: ${error.message}`, 'error');
            });
    }
   
    let isFetching = false;

    function fetchSubjectMarks() {
        if (isFetching) {
            console.log('Fetch already in progress, skipping');
            return;
        }
    
        isFetching = true;
        console.log('fetchSubjectMarks called');
    
        subjectList.innerHTML = ''; 
    
        fetch(`http://localhost:5000/get-marks?email=${userEmail}`)
            .then(response => response.json())
            .then(data => {
                console.log('Marks data received:', data);
                
                // Check for duplicates
                const uniqueSubjects = new Set();
                const uniqueData = data.filter(mark => {
                    const key = `${mark.subject_id}-${mark.subject_name}`;
                    if (uniqueSubjects.has(key)) {
                        console.warn(`Duplicate subject detected: ${mark.subject_name}`);
                        return false;
                    }
                    uniqueSubjects.add(key);
                    return true;
                });
    
                console.log('Unique data:', uniqueData);
    
                uniqueData.forEach(mark => {
                    console.log('Rendering mark:', mark);
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${mark.subject_name}</td>
                        <td>${mark.marks}%</td>
                        <td>
                            <button class="remove-btn" data-subject-id="${mark.subject_id}">
                                <i class="fas fa-times"></i>
                            </button>
                        </td>
                    `;
                    subjectList.appendChild(row);
                });
    
                document.querySelectorAll('.remove-btn').forEach(btn => {
                    btn.addEventListener('click', deleteSubjectMark);
                });
            })
            .catch(error => {
                console.error('Error fetching marks:', error);
                //showMessage(`Error fetching marks: ${error.message}`, 'error');
            })
            .finally(() => {
                isFetching = false;
            });
    }
    function displayCourses(courses) {
        //const coursesContainer = document.getElementById('coursesContainer');
        //const qualifiedCoursesCount = document.getElementById('qualifiedCoursesCount');

        //coursesContainer.innerHTML = '';

        qualifiedCoursesCount.innerHTML = `You qualify for ${courses.length} courses.`;

        if (courses.length === 0) {
            coursesContainer.innerHTML = '<p>No eligible courses found.</p>';
            return;
        }

        courses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.classList.add('course');
            courseElement.innerHTML = `
                <h3>${course.course_name}</h3>
                <p>${course.university_name}</p>
            `;
            coursesContainer.appendChild(courseElement);
        });
    }


    async function deleteSubjectMark(event) {
        const subjectId = event.currentTarget.getAttribute('data-subject-id');
        console.log('Attempting to delete subject with subjectId:', subjectId); // Log subjectId
        
        const currentUserId = await ensureUserId();
        console.log('Current user ID:', currentUserId); // Log currentUserId
        
        if (!currentUserId) {
            showMessage('User ID is not set. Please log in again.', 'error');
            return;
        }
    
        // Check if subjectId is valid
        if (!subjectId || subjectId === 'undefined') {
            showMessage('Invalid subject ID. Cannot delete marks.', 'error');
            return;
        }
    
        try {
            const response = await fetch('http://localhost:5000/deleteMarks', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'user-email': userEmail
                },
                body: JSON.stringify({ subjectId: parseInt(subjectId) })
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete subject marks');
            }
    
            const result = await response.json();
            showMessage(result.message || 'Subject marks deleted successfully!', 'success');
            fetchSubjectMarks(); // Refresh the subject list
        } catch (error) {
            console.error('Error deleting subject marks:', error);
            showMessage(`Error: ${error.message}`, 'error');
        }
    }


    addMarksForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const currentUserId = await ensureUserId();
        if (!currentUserId) {
            showMessage('User ID is not set. Please log in again.', 'error');
            return;
        }
        const subjectId = subjectSelect.value;
        const enteredMarks = subjectMarks.value;

        if (!subjectId || !enteredMarks) {
            showMessage('Please select a subject and enter marks.', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/addMarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-email': userEmail
                },
                body: JSON.stringify({ subjectId, marks: enteredMarks })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            showMessage('Marks submitted successfully!', 'success');
            fetchSubjectMarks();
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    });

    function showMessage(message, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.innerHTML = `<p class="${type}">${message}</p>`;
    }
});


