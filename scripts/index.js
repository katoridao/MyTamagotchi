import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgd64xynT0ppg6-E1RrPx2QEFZONTaIqM",
  authDomain: "mytamagotchi-fb787.firebaseapp.com",
  projectId: "mytamagotchi-fb787",
  storageBucket: "mytamagotchi-fb787.firebasestorage.app",
  messagingSenderId: "427722619339",
  appId: "1:427722619339:web:123996eab78d49202bde4e",
  measurementId: "G-CGZZDQRTEP",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const elements = {
  formTitle: document.getElementById("form-title"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  emailError: document.getElementById("email-error"),
  passwordError: document.getElementById("password-error"),
  authButton: document.getElementById("auth-button"),
  authLoading: document.getElementById("auth-loading"),
  toggleFormText: document.getElementById("toggle-form-text"),
  authContainer: document.getElementById("auth-container"),
  resetContainer: document.getElementById("reset-container"),
  resetEmail: document.getElementById("reset-email"),
  resetEmailError: document.getElementById("reset-email-error"),
  resetButton: document.getElementById("reset-button"),
  resetLoading: document.getElementById("reset-loading"),
  rememberMe: document.getElementById("remember-me"),
  rememberMeContainer: document.getElementById("remember-me-container"),
};

let isLogin = true;

// Function to toggle password visibility
window.togglePasswordVisibility = function (inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;
  if (input.type === "password") {
    input.type = "text";
    button.textContent = "Ẩn";
  } else {
    input.type = "password";
    button.textContent = "Hiện";
  }
};

// Function to toggle between login and registration forms
window.toggleForm = function () {
  isLogin = !isLogin;
  elements.formTitle.textContent = isLogin ? "Đăng nhập" : "Đăng ký";
  elements.toggleFormText.textContent = isLogin
    ? "Chưa có tài khoản? Đăng ký ngay!"
    : "Đã có tài khoản? Đăng nhập ngay!";
  elements.authButton.textContent = isLogin ? "Đăng nhập" : "Đăng ký";
  elements.emailError.style.display = "none";
  elements.passwordError.style.display = "none";
  elements.email.value = "";
  elements.password.value = "";
  elements.rememberMeContainer.style.display = isLogin ? "flex" : "none";
};

// Function to show the reset password form
window.showReset = function () {
  elements.authContainer.style.display = "none";
  elements.resetContainer.style.display = "block";
  elements.resetEmail.value = "";
  elements.resetEmailError.style.display = "none";
};

// Function to show the login form
window.showLogin = function () {
  elements.authContainer.style.display = "block";
  elements.resetContainer.style.display = "none";
  elements.email.value = "";
  elements.password.value = "";
  elements.emailError.style.display = "none";
  elements.passwordError.style.display = "none";
  elements.rememberMeContainer.style.display = isLogin ? "flex" : "none";
};

// Function to validate the login/registration form
function validateAuthForm(email, password) {
  let hasError = false;
  elements.emailError.style.display = "none";
  elements.passwordError.style.display = "none";

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailPattern.test(email)) {
    elements.emailError.style.display = "block";
    hasError = true;
  }
  if (!password || password.length < 6) {
    elements.passwordError.style.display = "block";
    hasError = true;
  }
  return !hasError;
}

// Function to validate the reset password form
function validateResetForm(email) {
  elements.resetEmailError.style.display = "none";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailPattern.test(email)) {
    elements.resetEmailError.style.display = "block";
    return false;
  }
  return true;
}

// Function to handle user authentication
window.handleAuth = async function () {
  const email = elements.email.value.trim();
  const password = elements.password.value;

  if (!validateAuthForm(email, password)) return;

  elements.authButton.disabled = true;
  elements.authLoading.style.display = "block";

  try {
    let userCredential;
    if (isLogin) {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (elements.rememberMe.checked) {
        localStorage.setItem(
          "tamagotchiCredentials",
          JSON.stringify({ email, password }),
        );
      } else {
        localStorage.removeItem("tamagotchiCredentials");
      }
    } else {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      localStorage.removeItem("tamagotchiCredentials");
      const userRef = doc(db, "Users", userCredential.user.uid);
      await setDoc(userRef, {
        gold: 0,
        items: [],
        currentPetId: null,
        email: email,
      });
      alert("Đăng ký thành công! Hãy tạo pet của bạn nhé!");
    }
    const user = userCredential.user;
    await loadPet(user.uid);
  } catch (error) {
    alert(`${isLogin ? "Đăng nhập" : "Đăng ký"} thất bại: ${error.message}`);
  } finally {
    elements.authButton.disabled = false;
    elements.authLoading.style.display = "none";
  }
};

// Function to handle password reset
window.resetPassword = async function () {
  const email = elements.resetEmail.value.trim();

  if (!validateResetForm(email)) return;

  elements.resetButton.disabled = true;
  elements.resetLoading.style.display = "block";

  try {
    await sendPasswordResetEmail(auth, email);
    alert(
      "Email khôi phục đã được gửi! Vui lòng kiểm tra hộp thư của bạn (có thể nằm trong mục spam).",
    );
    showLogin();
  } catch (error) {
    alert("Lỗi gửi email khôi phục: " + error.message);
  } finally {
    elements.resetButton.disabled = false;
    elements.resetLoading.style.display = "none";
  }
};

// Function to load pet data
async function loadPet(userId) {
  try {
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.currentPetId) {
        const petRef = doc(db, "Pets", userData.currentPetId);
        const petSnap = await getDoc(petRef);
        if (petSnap.exists()) {
          const petData = petSnap.data();
          alert(
            `Chào mừng trở lại! Bé ${petData.petName} đang chờ bạn! (Level: ${petData.level})`,
          );
          window.location.href = `html/game.html?uid=${userId}`;
        } else {
          window.location.href = `html/creation.html?uid=${userId}`;
        }
      } else {
        window.location.href = `html/creation.html?uid=${userId}`;
      }
    } else {
      await setDoc(userRef, { gold: 0, items: [], currentPetId: null });
      window.location.href = `html/creation.html?uid=${userId}`;
    }
  } catch (error) {
    console.error("Lỗi tải pet:", error);
    alert("Lỗi tải pet: " + error.message);
  }
}

// Function to attempt auto-login with stored credentials
async function tryAutoLogin() {
  const credentials = localStorage.getItem("tamagotchiCredentials");
  if (credentials) {
    const { email, password } = JSON.parse(credentials);
    elements.email.value = email;
    elements.password.value = password;
    elements.rememberMe.checked = true;

    elements.authButton.disabled = true;
    elements.authLoading.style.display = "block";

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      await loadPet(user.uid);
    } catch (error) {
      console.error("Tự động đăng nhập thất bại:", error);
      localStorage.removeItem("tamagotchiCredentials");
      elements.email.value = "";
      elements.password.value = "";
      elements.rememberMe.checked = false;
    } finally {
      elements.authButton.disabled = false;
      elements.authLoading.style.display = "none";
    }
  }
}

elements.rememberMeContainer.style.display = "flex";
tryAutoLogin();
