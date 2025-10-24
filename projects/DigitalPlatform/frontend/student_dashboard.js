document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const userNameElem = document.getElementById('user-name');
    const userEmailElem = document.getElementById('user-email');
    const userPhoneElem = document.getElementById('user-phone');
    const avatarImgElem = document.getElementById('avatar-img');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const avatarUrlInput = document.getElementById('avatar-url');
    const profileForm = document.getElementById('profile-form');
    const coursesListElem = document.getElementById('courses-list');
    const logoutButton = document.getElementById('logout-button');

    const fetchProfile = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/student/profile', {
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
            
            return user.enrolledCourses.map(c => c.course);

        } catch (err) {
            console.error(err);
            alert('Failed to load profile. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    };

    const fetchCourses = async (enrolledCourseIds) => {
        try {
            const response = await fetch('http://localhost:5000/api/courses', {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });
            if (!response.ok) throw new Error('Failed to fetch courses');
            const courses = await response.json();

            coursesListElem.innerHTML = '';
            courses.forEach(course => {
                const isEnrolled = enrolledCourseIds.includes(course._id);
                const courseCard = document.createElement('div');
                courseCard.className = 'course-card';
                courseCard.innerHTML = `
                    <h3>${course.title}</h3>
                    <p>${course.description}</p>
                    <img src="${course.thumbnail}" alt="${course.title} Thumbnail">
                    ${isEnrolled 
                        ? `<span class="enrolled-tag">Enrolled</span>` 
                        : `<button class="submit-button enroll-button" data-course-id="${course._id}">Enroll</button>`
                    }
                `;
                coursesListElem.appendChild(courseCard);
            });

            document.querySelectorAll('.enroll-button').forEach(button => {
                button.addEventListener('click', enrollInCourse);
            });
        } catch (err) {
            console.error(err);
            alert('Failed to load courses.');
        }
    };

    const enrollInCourse = async (e) => {
        const courseId = e.target.dataset.courseId;
        try {
            const response = await fetch('http://localhost:5000/api/student/enroll-course', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ courseId })
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.msg);
                const enrolledCourseIds = await fetchProfile();
                fetchCourses(enrolledCourseIds);
            } else {
                alert(data.msg);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred during enrollment.');
        }
    };

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedProfile = {
            name: nameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            avatar: avatarUrlInput.value
        };

        try {
            const response = await fetch('http://localhost:5000/api/student/profile', {
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

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    const enrolledCourseIds = await fetchProfile();
    fetchCourses(enrolledCourseIds);
});