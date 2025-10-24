document.addEventListener('DOMContentLoaded', () => {
    const studentTab = document.getElementById('student-tab');
    const teacherTab = document.getElementById('teacher-tab');
    
    const studentLoginForm = document.getElementById('student-login-form');
    const teacherLoginForm = document.getElementById('teacher-login-form');

    const studentLoginIdInput = document.getElementById('student-loginId');
    const studentOtpInputGroup = studentLoginForm.querySelector('.otp-input-group');
    const studentOtpInput = document.getElementById('student-otp');
    const studentGetOtpButton = studentLoginForm.querySelector('.get-otp-button');
    const studentVerifyOtpButton = studentLoginForm.querySelector('.verify-otp-button');

    // Tab switching logic
    studentTab.addEventListener('click', () => {
        studentTab.classList.add('active');
        teacherTab.classList.remove('active');
        studentLoginForm.classList.add('active');
        teacherLoginForm.classList.remove('active');
    });

    teacherTab.addEventListener('click', () => {
        teacherTab.classList.add('active');
        studentTab.classList.remove('active');
        teacherLoginForm.classList.add('active');
        studentLoginForm.classList.remove('active');
    });

    // Student Login Handler (unified)
    studentLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginId = studentLoginIdInput.value;
        if (studentGetOtpButton.style.display !== 'none') {
            try {
                const response = await fetch('http://localhost:5000/api/auth/student/request-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId })
                });
                const data = await response.json();
                alert(data.msg);
                if (response.ok) {
                    studentOtpInputGroup.style.display = 'flex';
                    studentVerifyOtpButton.style.display = 'block';
                    studentGetOtpButton.style.display = 'none';
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred. Please try again.');
            }
        }
    });

    studentVerifyOtpButton.addEventListener('click', async () => {
        const loginId = studentLoginIdInput.value;
        const otp = studentOtpInput.value;
        try {
            const response = await fetch('http://localhost:5000/api/auth/student/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginId, otp })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                alert('OTP Verified! Logging in...');
                window.location.href = 'student_dashboard.html';
            } else {
                alert(data.msg);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred during verification.');
        }
    });

    // Teacher Login Handler
    teacherLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const teacherId = document.getElementById('teacher-id').value;
        const teacherPassword = document.getElementById('teacher-password').value;

        try {
            const response = await fetch('http://localhost:5000/api/auth/teacher/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherId, password: teacherPassword })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                alert('Teacher Login Successful!');
                window.location.href = 'teacher_dashboard.html';
            } else {
                alert(data.msg);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred during login.');
        }
    });
});