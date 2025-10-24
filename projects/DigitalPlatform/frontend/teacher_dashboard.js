document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.all('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Existing profile elements
    const userNameElem = document.getElementById('user-name');
    const userEmailElem = document.getElementById('user-email');
    const userPhoneElem = document.getElementById('user-phone');
    const avatarImgElem = document.getElementById('avatar-img');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const avatarUrlInput = document.getElementById('avatar-url');
    const passwordInput = document.getElementById('password');
    const profileForm = document.getElementById('profile-form');
    const logoutButton = document.getElementById('logout-button');

    // New student roster elements
    const studentListContainer = document.getElementById('student-list');
    const studentModal = document.getElementById('student-modal');
    const modalAvatar = document.getElementById('modal-avatar');
    const modalName = document.getElementById('modal-name');
    const modalEmail = document.getElementById('modal-email');
    const modalPhone = document.getElementById('modal-phone');
    const attendanceLog = document.getElementById('attendance-log');
    const modalDetails = document.getElementById('modal-details');

    const API_BASE_URL = 'http://localhost:5000/api';

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/teacher/profile`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });
            if (!response.ok) throw new Error('Failed to fetch profile');
            const user = await response.json();
            
            userNameElem.textContent = user.name;
            userEmailElem.textContent = `Email: ${user.email || 'N/A'}`;
            userPhoneElem.textContent = `Phone: ${user.phone || 'N/A'}`;
            avatarImgElem.src = user.avatar;
            nameInput.value = user.name;
            emailInput.value = user.email || '';
            phoneInput.value = user.phone || '';
            avatarUrlInput.value = user.avatar;

        } catch (err) {
            console.error(err);
            alert('Failed to load profile. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/teacher/students`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });

            if (!response.ok) throw new Error('Failed to fetch students.');
            const students = await response.json();
            
            studentListContainer.innerHTML = ''; // Clear existing list
            
            if (students.length === 0) {
                studentListContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">No students found.</p>';
                return;
            }

            students.forEach(student => {
                const card = document.createElement('div');
                card.className = 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow flex flex-col items-center';
                card.innerHTML = `
                    <img class="w-24 h-24 rounded-full mb-2 object-cover" src="${student.avatar || 'https://via.placeholder.com/96'}" alt="Student Avatar">
                    <h4 class="text-lg font-semibold">${student.name}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${student.email || student.phone}</p>
                    <button class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" data-student-id="${student._id}">View Details</button>
                `;
                studentListContainer.appendChild(card);
            });

            // Add event listeners to "View Details" buttons
            document.querySelectorAll('[data-student-id]').forEach(button => {
                button.addEventListener('click', () => openStudentModal(button.dataset.studentId));
            });
        } catch (err) {
            console.error(err);
            alert('Failed to load student roster.');
        }
    };

    const openStudentModal = async (studentId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/teacher/students/${studentId}`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });
            if (!response.ok) throw new Error('Failed to fetch student details.');

            const student = await response.json();
            
            modalAvatar.src = student.avatar || 'https://via.placeholder.com/128';
            modalName.textContent = student.name;
            modalEmail.textContent = `Email: ${student.email || 'N/A'}`;
            modalPhone.textContent = `Phone: ${student.phone || 'N/A'}`;
            modalDetails.textContent = student.details || 'No additional details available.';

            // Render attendance log
            attendanceLog.innerHTML = '';
            if (student.attendance && student.attendance.length > 0) {
                student.attendance.forEach(record => {
                    const date = new Date(record.date).toLocaleDateString();
                    const status = record.status;
                    const logItem = document.createElement('p');
                    logItem.textContent = `${date}: ${status}`;
                    attendanceLog.appendChild(logItem);
                });
            } else {
                attendanceLog.innerHTML = '<p>No attendance records found.</p>';
            }

            studentModal.style.display = 'flex'; // Show modal
        } catch (err) {
            console.error(err);
            alert('Failed to load student details.');
        }
    };

    window.closeModal = () => {
        studentModal.style.display = 'none';
    };

    // Update Profile functionality
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedProfile = {
            name: nameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            avatar: avatarUrlInput.value
        };
        if (passwordInput.value) {
            updatedProfile.password = passwordInput.value;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/teacher/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(updatedProfile)
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.msg);
                await fetchProfile();
            } else {
                alert(data.msg);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update profile.');
        }
    });

    // Logout functionality
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    // Initial data fetch
    fetchProfile();
    fetchStudents();
});