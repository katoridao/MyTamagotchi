import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
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
const auth = getAuth(app);
const db = getFirestore(app);

const COLOR_MAP = {
  Đỏ: "#FF0000",
  Lục: "#008000",
  Xanh: "#0000FF",
  Vàng: "#FFFF00",
  Hồng: "#FFC0CB",
  Lam: "#00FFFF",
  Tím: "#800080",
  Cam: "#FFA500",
  Nâu: "#964B00",
  Đen: "#000000",
  Xám: "#808080",
};

const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get("uid");

const elements = {
  petName: document.getElementById("pet-name"),
  petType: document.getElementById("pet-type"),
  petColor: document.getElementById("pet-color"),
  petPreview: document.querySelector(".pet-preview"),
  petPreviewImage: document.getElementById("pet-preview-image"),
  nameError: document.getElementById("name-error"),
  typeError: document.getElementById("type-error"),
  colorError: document.getElementById("color-error"),
  petTypeError: document.getElementById("pet-type-error"),
  petTypeLoading: document.getElementById("pet-type-loading"),
  createButton: document.getElementById("create-pet-button"),
  createLoading: document.getElementById("create-loading"),
};

// Function to load pet types from Firestore
async function loadPetTypes() {
  elements.petType.innerHTML = '<option value="">--Chọn loại pet--</option>';
  elements.petTypeError.style.display = "none";
  elements.petTypeLoading.style.display = "block";

  try {
    const catesSnapshot = await getDocs(collection(db, "Cates"));
    if (catesSnapshot.empty) {
      throw new Error("Collection 'Cates' trống. Vui lòng kiểm tra Firestore.");
    }

    let hasPetTypes = false;
    catesSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (data?.name) {
        hasPetTypes = true;
        const option = document.createElement("option");
        option.value = option.textContent = data.name;
        elements.petType.appendChild(option);
      }
    });

    if (!hasPetTypes) {
      throw new Error(
        "Không tìm thấy loại pet nào! Vui lòng kiểm tra trường 'name' trong Firestore.",
      );
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách loại pet:", error);
    elements.petTypeError.textContent = error.message;
    elements.petTypeError.style.display = "block";
  } finally {
    elements.petTypeLoading.style.display = "none";
  }
}

// Function to update the pet preview image based on the selected pet type
function updatePetPreview() {
  const petType = elements.petType.value.toLowerCase();
  if (petType) {
    elements.petPreviewImage.src = `../img/${petType}/normal.png`;
    elements.petPreviewImage.style.display = "block";
  } else {
    elements.petPreviewImage.style.display = "none";
  }
}

// Function to update the pet's color preview
function updatePetColor() {
  const selectedColor = elements.petColor.value;
  if (selectedColor && COLOR_MAP[selectedColor]) {
    elements.petPreview.style.backgroundColor = COLOR_MAP[selectedColor];
  } else {
    elements.petPreview.style.backgroundColor = "#ccc";
  }
}

// Function to validate the pet creation form
function validateForm(petName, petType, petColor) {
  let hasError = false;
  elements.nameError.style.display = "none";
  elements.typeError.style.display = "none";
  elements.colorError.style.display = "none";

  if (!petName) {
    elements.nameError.style.display = "block";
    hasError = true;
  }
  if (!petType) {
    elements.typeError.style.display = "block";
    hasError = true;
  }
  if (!petColor) {
    elements.colorError.style.display = "block";
    hasError = true;
  }
  return !hasError;
}

// Function to create a new pet
window.createPet = async function () {
  const petName = elements.petName.value.trim();
  const petType = elements.petType.value;
  const petColor = elements.petColor.value;

  if (!validateForm(petName, petType, petColor)) return;

  elements.createButton.disabled = true;
  elements.createLoading.style.display = "block";

  const petData = {
    petName,
    petType,
    color: petColor,
    birthDate: new Date().toLocaleDateString("vi-VN"),
    level: 1,
    exp: 0,
    nextLevelExp: 100,
    health: 100,
    energy: 70,
    hunger: 70,
    cleanliness: 70,
    happiness: 70,
    lastUpdated: serverTimestamp(),
    ownerId: uid,
  };

  try {
    const petRef = doc(collection(db, "Pets"));
    await setDoc(petRef, petData);

    const userRef = doc(db, "Users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, { currentPetId: petRef.id });
    } else {
      await setDoc(userRef, {
        gold: 0,
        items: [],
        currentPetId: petRef.id,
      });
    }

    alert(`${petName} vừa trào đời! Hãy chăm sóc bé nhé!`);
    window.location.href = `game.html?uid=${uid}`;
  } catch (error) {
    console.error("Lỗi khi tạo pet:", error);
    alert("Lỗi khi tạo pet: " + error.message);
  } finally {
    elements.createButton.disabled = false;
    elements.createLoading.style.display = "none";
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (uid && uid === user.uid) {
      console.log("Người dùng đã đăng nhập:", user.uid);
      loadPetTypes();
    } else {
      alert("UID không hợp lệ! Vui lòng đăng nhập lại.");
      window.location.href = "../index.html";
    }
  } else {
    alert("Vui lòng đăng nhập để tạo pet!");
    window.location.href = "../index.html";
  }
});

window.updatePetPreview = updatePetPreview;
window.updatePetColor = updatePetColor;
