document.addEventListener("DOMContentLoaded", async () => {
  AOS.init();

  const backendURL = "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Sidebar Toggle
  const menuToggle = document.getElementById("menuToggle");
  const mobileSidebar = document.getElementById("mobileSidebar");
  const closeSidebar = document.getElementById("closeSidebar");

  if (menuToggle && mobileSidebar && closeSidebar) {
    menuToggle.addEventListener("click", () => mobileSidebar.classList.add("open"));
    closeSidebar.addEventListener("click", () => mobileSidebar.classList.remove("open"));
    window.addEventListener("click", e => {
      if (!mobileSidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        mobileSidebar.classList.remove("open");
      }
    });
  }

  // Mobile Login/Logout Toggle
  const mobileLogin = document.getElementById("mobile-login");
  const mobileLogout = document.getElementById("mobile-logout");

  if (token) {
    if (mobileLogout) mobileLogout.style.display = "block";
    if (mobileLogin) mobileLogin.style.display = "none";

    mobileLogout?.addEventListener("click", () => {
      localStorage.removeItem("token");
      location.reload();
    });

    // Fetch user info
    try {
      const res = await fetch(`${backendURL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Unauthorized");

      const user = await res.json();
      const userInfo = document.getElementById("user-info");
      const navAvatar = document.getElementById("nav-avatar");

      if (userInfo && navAvatar) {
        userInfo.innerText = user.name.split(" ")[0];
        navAvatar.src = user.avatar
          ? `${backendURL}/uploads/${user.avatar}`
          : "../assets/default-avatar.png";

        navAvatar.style.display = "inline-block";
        navAvatar.addEventListener("click", () => {
          window.location.href = "account.html";
        });
      }
    } catch (err) {
      console.warn("Session expired.");
      localStorage.removeItem("token");
    }
    } else {
    if (mobileLogout) mobileLogout.style.display = "none";
    if (mobileLogin) mobileLogin.style.display = "block";

    // 👉 Add this for guest users
    const navAvatar = document.getElementById("nav-avatar");
    const userInfo = document.getElementById("user-info");

    if (navAvatar && userInfo) {
      navAvatar.src = "../assets/user.png";
      navAvatar.style.display = "inline-block";
      userInfo.innerText = "Login";
      navAvatar.addEventListener("click", () => {
        window.location.href = "login.html";
      });
    }
  }


  // Login with OTP
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const otp = document.getElementById("login-otp").value;

      try {
        const res = await fetch(`${backendURL}/api/auth/login-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("token", data.token);
          window.location.href = "index.html";
        } else {
          alert(data.message || "Invalid OTP.");
        }
      } catch {
        alert("Login failed.");
      }
    });
  }

  // Register with OTP
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async e => {
      e.preventDefault();
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-password").value.trim();
      const otp = document.getElementById("reg-otp").value.trim();

      if (!name || !email || !password || !otp) {
        return alert("Please fill in all fields.");
      }

      try {
        const res = await fetch(`${backendURL}/api/auth/register-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, otp }),
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("token", data.token);
          window.location.href = "index.html";
        } else {
          alert(data.message || "Registration failed");
        }
      } catch (err) {
        alert("🚨 Could not complete registration.");
      }
    });
  }

  // Attach click handler for "Send OTP" button
  const sendOtpBtn = document.getElementById("send-otp");
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", sendRegisterOtp);
  }
});

// ✅ Only ONE Global Function
window.sendRegisterOtp = async () => {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();

  if (!name || !email) {
    alert("❌ Please enter name and email.");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/send-register-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("✅ " + data.message);
    } else {
      alert("❌ " + (data.message || "Something went wrong"));
    }
  } catch (error) {
    console.error("OTP Error:", error);
    alert("🚨 Failed to send OTP.");
  }
};

// ✅ Google Login Handler
window.handleGoogleLogin = async response => {
  try {
    const res = await fetch("http://localhost:5000/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      window.location.href = "index.html";
    } else {
      alert(data.message || "Google login failed.");
    }
  } catch {
    alert("Google login error.");
  }
};

// ✅ Optional: Login OTP sender if you use it
window.sendLoginOtp = async () => {
  const email = document.getElementById("login-email").value;
  if (!email) return alert("Enter email first.");
  try {
    const res = await fetch("http://localhost:5000/api/auth/send-login-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    alert(data.message);
  } catch {
    alert("Failed to send OTP.");
  }
};






const navAvatar = document.getElementById("nav-avatar");
const userInfo = document.getElementById("user-info");
const mobileAvatar = document.getElementById("mobile-avatar");
const mobileName = document.getElementById("mobile-name");
const token = localStorage.getItem("token");

if (token) {
  fetch("http://localhost:5000/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => {
      if (!res.ok) throw new Error("Invalid");
      return res.json();
    })
    .then(user => {
      // Set avatar & name for desktop
      if (navAvatar) {
        navAvatar.src = `http://localhost:5000/uploads/${user.avatar || "default.png"}`;
        navAvatar.onclick = () => (window.location.href = "account.html");
      }

      if (userInfo) userInfo.textContent = user.name.split(" ")[0];

      // ✅ Set avatar & name for mobile sidebar
      if (mobileAvatar) {
        mobileAvatar.src = `http://localhost:5000/uploads/${user.avatar || "default.png"}`;
        mobileAvatar.onclick = () => (window.location.href = "account.html");
      }
      if (mobileName) mobileName.textContent = user.name.split(" ")[0];
    })
    .catch(() => {
      // fallback
      if (navAvatar) navAvatar.src = "../assets/user.png";
      if (mobileAvatar) mobileAvatar.src = "../assets/user.png";
    });
} else {
  if (navAvatar) {
    navAvatar.src = "../assets/user.png";
    navAvatar.onclick = () => (window.location.href = "login.html");
  }
  if (userInfo) userInfo.textContent = "Login";

  if (mobileAvatar) {
    mobileAvatar.src = "../assets/user.png";
    mobileAvatar.onclick = () => (window.location.href = "login.html");
  }
  if (mobileName) mobileName.textContent = "Guest";
}
