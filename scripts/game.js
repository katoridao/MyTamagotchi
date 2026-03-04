import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
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
const UPDATE_INTERVAL_SECONDS = 10;
const SLOW_DECAY_THRESHOLD_SECONDS = 60;
const SLOW_DECAY_MULTIPLIER = 0.5;
const WELCOME_BACK_THRESHOLD_SECONDS = 43200;
const WELCOME_BACK_BOOST = 15;
const PASSIVE_RECOVERY_THRESHOLD = 70;
const PASSIVE_RECOVERY_AMOUNT = 1;

const elements = {
  petDisplay: document.getElementById("pet-display"),
  petImage: document.getElementById("pet-image"),
  petStatus: document.getElementById("pet-status"),
  actionStatus: document.getElementById("action-status"),
  healthBar: document.getElementById("health-bar"),
  energyBar: document.getElementById("energy-bar"),
  hungerBar: document.getElementById("hunger-bar"),
  cleanlinessBar: document.getElementById("cleanliness-bar"),
  happinessBar: document.getElementById("happiness-bar"),
  petHealth: document.getElementById("pet-health"),
  petEnergy: document.getElementById("pet-energy"),
  petHunger: document.getElementById("pet-hunger"),
  petCleanliness: document.getElementById("pet-cleanliness"),
  petHappiness: document.getElementById("pet-happiness"),
  goldAmount: document.getElementById("gold-amount"),
  playButton: document.getElementById("play-button"),
  batheButton: document.getElementById("bathe-button"),
  feedButton: document.getElementById("feed-button"),
  careButton: document.getElementById("care-button"),
  sleepButton: document.getElementById("sleep-button"),
  itemSelect: document.getElementById("item-select"),
  dialogPetName: document.getElementById("dialog-pet-name"),
  dialogPetType: document.getElementById("dialog-pet-type"),
  dialogPetColor: document.getElementById("dialog-pet-color"),
  dialogPetBirthdate: document.getElementById("dialog-pet-birthdate"),
  dialogPetLevel: document.getElementById("dialog-pet-level"),
  infoDialog: document.getElementById("info-dialog"),
  overlay: document.getElementById("overlay"),
  shopOverlay: document.getElementById("shop-overlay"),
  shopDialog: document.getElementById("shop-dialog"),
};

const sounds = {
  hungry: new Audio(
    "https://www.myinstants.com/media/sounds/hungry-stomach-growling.mp3",
  ),
  sad: new Audio("https://www.myinstants.com/media/sounds/sad-cat-meow.mp3"),
  levelUp: new Audio("https://www.myinstants.com/media/sounds/level-up.mp3"),
};

let petData = null;
let userData = null;
let petId = null;
let updateInterval = null;
let isInteracting = false;
let currentAction = null;
let actionTimer = null;
let timeLeft = 0;
let lowStatCount = 0;
let messageUpdateCounter = 0;
const MESSAGE_UPDATE_INTERVAL = 3;
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get("uid");

const actionMessages = {
  Chơi: [
    (petName, time) => `${petName} đang vui vẻ chơi đùa! Còn ${time}`,
    (petName, time) => `${petName} đang chạy nhảy khắp nơi! Còn ${time}`,
    (petName, time) => `${petName} đang chơi trò đuổi bắt! Còn ${time}`,
  ],
  "Tắm rửa": [
    (petName, time) => `${petName} đang thư giãn trong bồn tắm! Còn ${time}`,
    (petName, time) => `${petName} đang nghịch nước tung tóe! Còn ${time}`,
    (petName, time) =>
      `${petName} đang thích thú với bọt xà phòng! Còn ${time}`,
  ],
  "Cho ăn": [
    (petName, time) => `${petName} đang ăn ngon lành! Còn ${time}`,
    (petName, time) => `${petName} đang nhai nhóp nhép! Còn ${time}`,
    (petName, time) => `${petName} đang thưởng thức bữa ăn! Còn ${time}`,
  ],
  "Chăm sóc": [
    (petName, time) => `${petName} đang được chăm sóc cẩn thận! Còn ${time}`,
    (petName, time) => `${petName} đang cảm nhận sự yêu thương! Còn ${time}`,
    (petName, time) => `${petName} đang được vuốt ve nhẹ nhàng! Còn ${time}`,
  ],
  Ngủ: [
    (petName, time) => `${petName} đang ngủ ngon giấc! Còn ${time}`,
    (petName, time) => `${petName} đang mơ mộng trong giấc ngủ! Còn ${time}`,
    (petName, time) => `${petName} đang ngáy khò khò! Còn ${time}`,
  ],
  "Đọc sách": [
    (petName, time) => `${petName} đang chăm chú đọc sách! Còn ${time}`,
    (petName, time) =>
      `${petName} đang khám phá một câu chuyện thú vị! Còn ${time}`,
    (petName, time) =>
      `${petName} đang đắm mình trong thế giới sách! Còn ${time}`,
  ],
  "Trượt tuyết": [
    (petName, time) => `${petName} đang trượt tuyết thật vui! Còn ${time}`,
    (petName, time) => `${petName} đang lướt trên dốc tuyết! Còn ${time}`,
    (petName, time) =>
      `${petName} đang cảm nhận gió lạnh khi trượt tuyết! Còn ${time}`,
  ],
};

// Function to load pet and user data from Firestore
async function loadPet() {
  if (!uid) {
    alert("Không tìm thấy UID người dùng!");
    return (window.location.href = "../index.html");
  }

  try {
    const userRef = doc(db, "Users", uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, { gold: 0, items: [], currentPetId: null });
      alert("Không tìm thấy dữ liệu người dùng! Hãy tạo pet mới.");
      return (window.location.href = `creation.html?uid=${uid}`);
    }

    userData = userSnap.data();
    if (!userData.currentPetId) {
      alert("Không tìm thấy pet!");
      return (window.location.href = `creation.html?uid=${uid}`);
    }

    petId = userData.currentPetId;
    const petRef = doc(db, "Pets", petId);
    const petSnap = await getDoc(petRef);
    if (petSnap.exists()) {
      petData = petSnap.data();
      petData.nextLevelExp = 100 + (petData.level - 1) * 30;
      petData.isReading = petData.isReading || false;
      petData.isSkiing = petData.isSkiing || false;
      await updateStatsBasedOnTime();
      applyWelcomeBackBoost();
      populateItems();
      displayPet();
      startStatUpdates();
    } else {
      alert("Không tìm thấy pet!");
      window.location.href = `creation.html?uid=${uid}`;
    }
  } catch (error) {
    console.error("Lỗi khi tải pet:", error);
    alert("Lỗi khi tải pet: " + error.message);
  }
}

// Function to populate shop items and user inventory
function populateItems() {
  const shopItems = document.getElementById("shopItems");
  shopItems.innerHTML = "";
  const items = [
    { name: "Bánh thưởng", price: 8 },
    { name: "Viên uống con nhộng", price: 10 },
    { name: "Thức ăn đặc biệt", price: 15 },
    { name: "Sách", price: 20 },
    { name: "Ván trượt tuyết", price: 25 },
    { name: "Vương liệm", price: 100 },
    { name: "Rau má", price: 666 },
  ];

  items.forEach((item) => {
    const li = document.createElement("li");
    const hasItem = userData.items.includes(item.name);
    li.className = "shop-item";
    li.innerHTML = `
            <span>${item.name} (${item.price} vàng)</span>
            ${hasItem ? '<span class="owned">Đã mua</span>' : `<button onclick="buyItem('${item.name}', ${item.price})">Mua</button>`}
        `;
    shopItems.appendChild(li);
  });

  elements.itemSelect.innerHTML = '<option value="">--Chọn vật phẩm--</option>';
  userData.items.forEach((item) => {
    const option = document.createElement("option");
    option.value = option.textContent = item;
    elements.itemSelect.appendChild(option);
  });
}

// Function to determine and return the pet's current status message
function getPetStatus() {
  const allStats = [
    petData.health,
    petData.energy,
    petData.hunger,
    petData.cleanliness,
    petData.happiness,
  ];
  if (allStats.every((stat) => stat > 80)) {
    return `${petData.petName} đang cảm thấy tuyệt vời!`;
  }

  if (petData.health < 30) return `${petData.petName} đang ốm yếu`;
  if (petData.energy < 30) return `${petData.petName} đang ngái ngủ`;
  if (petData.hunger < 30) return `${petData.petName} đang đói`;
  if (petData.cleanliness < 30) return `${petData.petName} đang bẩn`;
  if (petData.happiness < 30) return `${petData.petName} đang buồn`;

  return `${petData.petName} đang cảm thấy bình thường`;
}

// Function to update the pet's display based on its stats and actions
function displayPet() {
  elements.petHealth.textContent = `${petData.health}/100`;
  elements.petEnergy.textContent = `${petData.energy}/100`;
  elements.petHunger.textContent = `${petData.hunger}/100`;
  elements.petCleanliness.textContent = `${petData.cleanliness}/100`;
  elements.petHappiness.textContent = `${petData.happiness}/100`;
  elements.healthBar.style.width = `${petData.health}%`;
  elements.energyBar.style.width = `${petData.energy}%`;
  elements.hungerBar.style.width = `${petData.hunger}%`;
  elements.cleanlinessBar.style.width = `${petData.cleanliness}%`;
  elements.happinessBar.style.width = `${petData.happiness}%`;
  elements.goldAmount.textContent = userData.gold;

  elements.dialogPetName.textContent = petData.petName;
  elements.dialogPetType.textContent = petData.petType;
  elements.dialogPetColor.textContent = petData.color;
  elements.dialogPetBirthdate.textContent = petData.birthDate;
  elements.dialogPetLevel.textContent = petData.level;

  elements.petDisplay.style.backgroundColor =
    COLOR_MAP[petData.color] || "#fff";
  elements.petDisplay.classList.remove("jumping", "sad", "shaking", "fading");

  const petType = petData.petType.toLowerCase();
  const petImage = elements.petImage;

  if (petData.isReading) {
    petImage.src = `../img/${petType}/reading.png`;

    const minutes = Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeLeft % 60).toString().padStart(2, "0");
    const timeDisplay = `${minutes}:${seconds}`;
    const messages = actionMessages["Đọc sách"];
    let message;
    if (messages && messageUpdateCounter % MESSAGE_UPDATE_INTERVAL === 0) {
      message = messages[Math.floor(Math.random() * messages.length)](
        petData.petName,
        timeDisplay,
      );
    } else {
      message = elements.actionStatus.textContent.replace(
        /\d{2}:\d{2}/,
        timeDisplay,
      );
    }
    elements.actionStatus.textContent = message;
    elements.actionStatus.classList.add("show");
  } else if (petData.isSkiing) {
    petImage.src = `../img/${petType}/skiing.png`;

    const minutes = Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeLeft % 60).toString().padStart(2, "0");
    const timeDisplay = `${minutes}:${seconds}`;
    const messages = actionMessages["Trượt tuyết"];
    let message;
    if (messages && messageUpdateCounter % MESSAGE_UPDATE_INTERVAL === 0) {
      message = messages[Math.floor(Math.random() * messages.length)](
        petData.petName,
        timeDisplay,
      );
    } else {
      message = elements.actionStatus.textContent.replace(
        /\d{2}:\d{2}/,
        timeDisplay,
      );
    }
    elements.actionStatus.textContent = message;
    elements.actionStatus.classList.add("show");
  } else if (isInteracting && currentAction) {
    const actionImageMap = {
      Chơi: "playing",
      "Tắm rửa": "bathing",
      "Cho ăn": "eating",
      "Chăm sóc": "caring",
      Ngủ: "sleeping",
    };
    const actionImage = actionImageMap[currentAction];
    petImage.src = `../img/${petType}/${actionImage}.png`;

    const minutes = Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeLeft % 60).toString().padStart(2, "0");
    const timeDisplay = `${minutes}:${seconds}`;
    const messages = actionMessages[currentAction];
    let message;
    if (messages && messageUpdateCounter % MESSAGE_UPDATE_INTERVAL === 0) {
      message = messages[Math.floor(Math.random() * messages.length)](
        petData.petName,
        timeDisplay,
      );
    } else {
      message = elements.actionStatus.textContent.replace(
        /\d{2}:\d{2}/,
        timeDisplay,
      );
    }
    elements.actionStatus.textContent = message;
    elements.actionStatus.classList.add("show");
  } else {
    const allStats = [
      petData.health,
      petData.energy,
      petData.hunger,
      petData.cleanliness,
      petData.happiness,
    ];
    if (allStats.every((stat) => stat > 80)) {
      petImage.src = `../img/${petType}/happy.png`;
      elements.petDisplay.classList.add("jumping");
    } else if (petData.health < 30) {
      petImage.src = `../img/${petType}/sick.png`;
    } else if (petData.energy < 30) {
      petImage.src = `../img/${petType}/asleep.png`;
      elements.petDisplay.classList.add("fading");
    } else if (petData.hunger < 30) {
      petImage.src = `../img/${petType}/hungry.png`;
      elements.petDisplay.classList.add("shaking");
      sounds.hungry.play();
    } else if (petData.cleanliness < 30) {
      petImage.src = `../img/${petType}/dirty.png`;
    } else if (petData.happiness < 30) {
      petImage.src = `../img/${petType}/sad.png`;
      elements.petDisplay.classList.add("sad");
      sounds.sad.play();
    } else {
      petImage.src = `../img/${petType}/normal.png`;
    }
    elements.actionStatus.classList.remove("show");
  }

  elements.petStatus.textContent = getPetStatus();
}

// Function to apply a welcome-back boost to pet stats after a long absence
async function applyWelcomeBackBoost() {
  if (!petData.lastUpdated) return;

  const lastUpdated = petData.lastUpdated.toDate();
  const now = new Date();
  const timeDiffSeconds = Math.floor((now - lastUpdated) / 1000);

  if (timeDiffSeconds >= WELCOME_BACK_THRESHOLD_SECONDS) {
    petData.health = Math.min(petData.health + WELCOME_BACK_BOOST, 100);
    petData.energy = Math.min(petData.energy + WELCOME_BACK_BOOST, 100);
    petData.hunger = Math.min(petData.hunger + WELCOME_BACK_BOOST, 100);
    petData.cleanliness = Math.min(
      petData.cleanliness + WELCOME_BACK_BOOST,
      100,
    );
    petData.happiness = Math.min(petData.happiness + WELCOME_BACK_BOOST, 100);
    alert(
      `Chào mừng bạn trở lại! ${petData.petName} rất vui khi gặp lại bạn và đã được hồi phục +${WELCOME_BACK_BOOST} cho tất cả chỉ số!`,
    );
    petData.lastUpdated = serverTimestamp();
    await updatePet();
  }
}

// Function to update pet stats based on elapsed time since last update
async function updateStatsBasedOnTime() {
  if (!petData.lastUpdated) {
    petData.lastUpdated = serverTimestamp();
    return await updatePet();
  }

  const lastUpdated = petData.lastUpdated.toDate();
  const now = new Date();
  const timeDiffSeconds = Math.floor((now - lastUpdated) / 1000);
  const updatesMissed = Math.floor(timeDiffSeconds / UPDATE_INTERVAL_SECONDS);

  if (updatesMissed > 0) {
    let decayMultiplier = 1;
    if (timeDiffSeconds >= SLOW_DECAY_THRESHOLD_SECONDS) {
      decayMultiplier = SLOW_DECAY_MULTIPLIER;
    }

    const healthDecay = Math.min(0.5 * updatesMissed * decayMultiplier, 70);
    const energyDecay = Math.min(1 * updatesMissed * decayMultiplier, 70);
    const hungerDecay = Math.min(1 * updatesMissed * decayMultiplier, 70);
    const cleanlinessDecay = Math.min(
      0.5 * updatesMissed * decayMultiplier,
      70,
    );
    const happinessDecay = Math.min(0.5 * updatesMissed * decayMultiplier, 70);

    petData.health = Math.max(petData.health - healthDecay, 0);
    petData.energy = Math.max(petData.energy - energyDecay, 0);
    petData.hunger = Math.max(petData.hunger - hungerDecay, 0);
    petData.cleanliness = Math.max(petData.cleanliness - cleanlinessDecay, 0);
    petData.happiness = Math.max(petData.happiness - happinessDecay, 0);

    petData.lastUpdated = serverTimestamp();
    await updatePet();
  }
}

// Function to start periodic updates for pet stats
function startStatUpdates() {
  updateInterval = setInterval(async () => {
    // Online decay
    petData.health = Math.max(petData.health - 0.5, 0);
    petData.energy = Math.max(petData.energy - 1, 0);
    petData.hunger = Math.max(petData.hunger - 1, 0);
    petData.cleanliness = Math.max(petData.cleanliness - 0.5, 0);
    petData.happiness = Math.max(petData.happiness - 1, 0);

    // Check if pet is dead
    if (petData.health <= 0) {
      clearInterval(updateInterval);
      const petType = petData.petType.toLowerCase();
      elements.petImage.src = `../img/${petType}/leave.png`;
      elements.petDisplay.classList.remove(
        "jumping",
        "sad",
        "shaking",
        "fading",
      );
      elements.petStatus.textContent = "";
      elements.actionStatus.classList.remove("show");
      elements.playButton.disabled = true;
      elements.batheButton.disabled = true;
      elements.feedButton.disabled = true;
      elements.careButton.disabled = true;
      elements.sleepButton.disabled = true;

      setTimeout(async () => {
        alert(
          `Bạn đã không chăm sóc ${petData.petName} thật chu đáo, ${petData.petName} đã rất buồn và quyết định rời đi...`,
        );
        await deletePet();
      }, 500);
      return;
    }

    // Additional health penalty
    const lowStats = [
      petData.energy,
      petData.hunger,
      petData.cleanliness,
      petData.happiness,
    ].filter((stat) => stat < 30).length;
    if (lowStats > 0) {
      lowStatCount++;
      if (lowStatCount >= 6) {
        petData.health = Math.max(petData.health - 5, 0);
        lowStatCount = 0;
      }
    } else {
      lowStatCount = 0;
    }

    // Passive recovery
    const allStats = [
      petData.health,
      petData.energy,
      petData.hunger,
      petData.cleanliness,
      petData.happiness,
    ];
    if (allStats.every((stat) => stat >= PASSIVE_RECOVERY_THRESHOLD)) {
      petData.health = Math.min(petData.health + PASSIVE_RECOVERY_AMOUNT, 100);
      petData.energy = Math.min(petData.energy + PASSIVE_RECOVERY_AMOUNT, 100);
      petData.hunger = Math.min(petData.hunger + PASSIVE_RECOVERY_AMOUNT, 100);
      petData.cleanliness = Math.min(
        petData.cleanliness + PASSIVE_RECOVERY_AMOUNT,
        100,
      );
      petData.happiness = Math.min(
        petData.happiness + PASSIVE_RECOVERY_AMOUNT,
        100,
      );
    }

    // Exp gains
    if (allStats.every((stat) => stat > 80)) {
      petData.exp += 3;
    } else if (allStats.every((stat) => stat > 50)) {
      petData.exp += 2;
    }

    // Level up
    if (petData.exp >= petData.nextLevelExp) {
      petData.level += 1;
      petData.exp = 0;
      petData.nextLevelExp = 100 + (petData.level - 1) * 30;
      const goldReward = 20 + (petData.level - 1) * 15;
      userData.gold += goldReward;
      sounds.levelUp.play();
      alert(
        `Chúc mừng! ${petData.petName} đã lên cấp ${petData.level}! Bạn nhận được ${goldReward} vàng!`,
      );
    }

    petData.lastUpdated = serverTimestamp();
    await updatePet();
    displayPet();
  }, UPDATE_INTERVAL_SECONDS * 1000);
}

// Function to update pet and user data in Firestore
async function updatePet() {
  try {
    const petRef = doc(db, "Pets", petId);
    await updateDoc(petRef, petData);

    const userRef = doc(db, "Users", uid);
    await updateDoc(userRef, {
      gold: userData.gold,
      items: userData.items,
      currentPetId: userData.currentPetId,
    });

    console.log("Pet and user updated successfully!");
  } catch (error) {
    console.error("Lỗi khi cập nhật pet:", error);
    alert("Lỗi khi cập nhật pet: " + error.message);
  }
}

// Function to delete the current pet from Firestore
async function deletePet(isAlreadyShown = false) {
  try {
    const petRef = doc(db, "Pets", petId);
    await deleteDoc(petRef);

    const userRef = doc(db, "Users", uid);
    userData.gold = 0;
    userData.items = [];
    await updateDoc(userRef, { currentPetId: null, gold: 0, items: [] });

    console.log("Pet deleted successfully!");
    if (!isAlreadyShown) {
      alert(`${petData.petName} đã được gửi vào trung tâm!`);
    }
    window.location.href = `creation.html?uid=${uid}`;
  } catch (error) {
    console.error("Lỗi khi xóa pet:", error);
    alert("Lỗi khi xóa pet: " + error.message);
  }
}

// Function to start a pet interaction with specified action and duration
function startInteraction(actionName, duration, callback) {
  if (isInteracting)
    return alert(`${petData.petName} đang bận, hãy đợi một chút!`);

  isInteracting = true;
  currentAction = actionName;
  timeLeft = duration;
  messageUpdateCounter = 0;

  if (actionName === "Đọc sách") {
    petData.isReading = true;
  } else if (actionName === "Trượt tuyết") {
    petData.isSkiing = true;
  }

  elements.playButton.disabled = true;
  elements.batheButton.disabled = true;
  elements.feedButton.disabled = true;
  elements.careButton.disabled = true;
  elements.sleepButton.disabled = true;

  displayPet();

  actionTimer = setInterval(() => {
    timeLeft--;
    messageUpdateCounter++;

    displayPet();

    if (timeLeft <= 0) {
      clearInterval(actionTimer);
      isInteracting = false;

      if (actionName === "Đọc sách") {
        petData.isReading = false;
      } else if (actionName === "Trượt tuyết") {
        petData.isSkiing = false;
      }

      currentAction = null;
      timeLeft = 0;
      messageUpdateCounter = 0;
      callback();
      elements.playButton.disabled = false;
      elements.batheButton.disabled = false;
      elements.feedButton.disabled = false;
      elements.careButton.disabled = false;
      elements.sleepButton.disabled = false;
      elements.actionStatus.classList.remove("show");
      displayPet();
    }
  }, 1000);
}

// Function to feed the pet
window.feedPet = async () => {
  if (petData.hunger >= 100)
    return alert(`${petData.petName} đã no, không thể cho ăn thêm!`);
  startInteraction("Cho ăn", 5, async () => {
    petData.hunger = Math.min(petData.hunger + 20, 100);
    petData.happiness = Math.min(petData.happiness + 10, 100);
    petData.energy = Math.max(petData.energy - 10, 0);

    // Pet-specific cleanliness changes
    if (petData.petType.toLowerCase() === "heo") {
      petData.cleanliness = Math.max(petData.cleanliness - 20, 0);
    } else {
      petData.cleanliness = Math.max(petData.cleanliness - 10, 0);
    }

    const expMultiplier = 1 + (petData.level - 1) * 0.1;
    petData.exp += 15 * expMultiplier;
    userData.gold += 5;
    petData.lastUpdated = serverTimestamp();
    await updatePet();
    displayPet();
  });
};

// Function to play with the pet
window.playWithPet = async () => {
  startInteraction("Chơi", 8, async () => {
    petData.happiness = Math.min(petData.happiness + 25, 100);

    // Pet-specific energy and hunger changes
    if (petData.petType.toLowerCase() === "chó") {
      // Dog uses more energy and hunger when playing
      petData.energy = Math.max(petData.energy - 30, 0);
      petData.hunger = Math.max(petData.hunger - 20, 0);
    } else {
      petData.energy = Math.max(petData.energy - 15, 0);
      petData.hunger = Math.max(petData.hunger - 10, 0);
    }

    petData.cleanliness = Math.max(petData.cleanliness - 15, 0);
    const expMultiplier = 1 + (petData.level - 1) * 0.1;
    petData.exp += 20 * expMultiplier;
    userData.gold += 8;
    petData.lastUpdated = serverTimestamp();
    await updatePet();
    displayPet();
  });
};

// Function to bathe the pet
window.bathePet = async () => {
  if (petData.cleanliness >= 100)
    return alert(`${petData.petName} đã sạch sẽ, không cần tắm thêm!`);
  startInteraction("Tắm rửa", 6, async () => {
    const wasDirty = petData.cleanliness < 30;

    // Pet-specific cleanliness increase
    if (petData.petType.toLowerCase() === "mèo") {
      // Cat gains less cleanliness when bathing
      petData.cleanliness = Math.min(petData.cleanliness + 10, 100);
    } else {
      petData.cleanliness = Math.min(petData.cleanliness + 30, 100);
    }

    petData.happiness = Math.min(petData.happiness + 15, 100);
    if (wasDirty) petData.happiness = Math.min(petData.happiness + 10, 100);
    petData.energy = Math.max(petData.energy - 10, 0);
    const expMultiplier = 1 + (petData.level - 1) * 0.1;
    petData.exp += 15 * expMultiplier;
    userData.gold += 6;
    petData.lastUpdated = serverTimestamp();
    await updatePet();
    displayPet();
  });
};

// Function to care for the pet's health
window.careForPet = async () => {
  if (petData.health >= 100)
    return alert(`${petData.petName} đã khỏe mạnh, không cần chăm sóc thêm!`);
  startInteraction("Chăm sóc", 10, async () => {
    const wasSick = petData.health < 30;
    petData.health = Math.min(petData.health + 25, 100);
    petData.happiness = Math.min(petData.happiness + 15, 100);
    if (wasSick) petData.happiness = Math.min(petData.happiness + 10, 100);
    petData.energy = Math.max(petData.energy - 10, 0);
    const expMultiplier = 1 + (petData.level - 1) * 0.1;
    petData.exp += 25 * expMultiplier;
    userData.gold += 6;
    petData.lastUpdated = serverTimestamp();
    await updatePet();
    displayPet();
  });
};

// Function to let the pet sleep
window.sleepPet = async () => {
  if (petData.energy >= 100)
    return alert(`${petData.petName} đã đầy năng lượng, không cần ngủ thêm!`);
  startInteraction("Ngủ", 8, async () => {
    const wasAsleep = petData.energy < 30;
    petData.energy = Math.min(petData.energy + 40, 100);
    petData.hunger = Math.max(petData.hunger - 10, 0);
    petData.happiness = Math.min(petData.happiness + 10, 100);
    petData.cleanliness = Math.max(petData.cleanliness - 10, 0);
    if (wasAsleep) petData.happiness = Math.min(petData.happiness + 10, 100);
    const expMultiplier = 1 + (petData.level - 1) * 0.1;
    petData.exp += 15 * expMultiplier;
    userData.gold += 5;
    petData.lastUpdated = serverTimestamp();
    await updatePet();
    displayPet();
  });
};

// Function to use a selected item on the pet
window.useItem = async () => {
  const selectedItem = elements.itemSelect.value;
  if (!selectedItem) return alert("Vui lòng chọn một vật phẩm!");

  if (isInteracting) return alert("Thú cưng đang bận, hãy đợi một chút!");

  if (selectedItem === "Thức ăn đặc biệt") {
    petData.hunger = Math.min(petData.hunger + 40, 100);
    petData.happiness = Math.min(petData.happiness + 10, 100);
    petData.energy = Math.min(petData.energy + 10, 100);
    alert(
      `${petData.petName} đã dùng Thức ăn đặc biệt! Hunger +40, Happiness +10, Energy +5`,
    );
  } else if (selectedItem === "Viên uống con nhộng") {
    petData.health = Math.min(petData.health + 30, 100);
    petData.energy = Math.min(petData.energy + 10, 100);
    petData.happiness = Math.min(petData.happiness + 10, 100);
    alert(
      `${petData.petName} đã dùng Viên uống con nhộng! Health +30, Energy +10, Happiness +5`,
    );
  } else if (selectedItem === "Bánh thưởng") {
    petData.happiness = Math.min(petData.happiness + 20, 100);
    petData.hunger = Math.min(petData.hunger + 15, 100);
    petData.energy = Math.max(petData.energy - 10, 0);
    alert(
      `${petData.petName} đã dùng Bánh thưởng! Happiness +20, Hunger +15, Energy -5`,
    );
  } else if (selectedItem === "Vương liệm") {
    const stats = ["hunger", "cleanliness", "health", "energy", "happiness"];
    const statNames = {
      hunger: "Hunger",
      cleanliness: "Cleanliness",
      health: "Health",
      energy: "Energy",
      happiness: "Happiness",
    };

    const numStatsToAffect = Math.floor(Math.random() * 5) + 1;
    const shuffledStats = stats.sort(() => Math.random() - 0.5);
    const affectedStats = shuffledStats.slice(0, numStatsToAffect);

    let effectMessage = `${petData.petName} đã chơi Vương liệm! Hiệu ứng:\n`;

    affectedStats.forEach((stat) => {
      const changeValue = Math.floor(Math.random() * 101);
      const isIncrease = Math.random() < 0.5;

      const previousValue = petData[stat];
      if (isIncrease) {
        petData[stat] = Math.min(petData[stat] + changeValue, 100);
        effectMessage += `${statNames[stat]} +${changeValue} (từ ${previousValue} lên ${petData[stat]})\n`;
      } else {
        petData[stat] = Math.max(petData[stat] - changeValue, 0);
        effectMessage += `${statNames[stat]} -${changeValue} (từ ${previousValue} xuống ${petData[stat]})\n`;
      }
    });

    alert(effectMessage);
  } else if (selectedItem === "Rau má") {
    petData.health = Math.min(petData.health + 20, 100);
    petData.energy = Math.min(petData.energy + 20, 100);
    petData.hunger = Math.min(petData.hunger + 20, 100);
    petData.cleanliness = Math.min(petData.cleanliness + 20, 100);
    petData.happiness = Math.min(petData.happiness + 20, 100);
    let effectMessage = `${petData.petName} đã dùng Rau má! Tất cả chỉ số +20`;
    if (userData.items.length > 1) {
      const remainingItems = userData.items.filter((item) => item !== "Rau má");
      if (remainingItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingItems.length);
        const removedItem = remainingItems[randomIndex];
        userData.items = userData.items.filter((item) => item !== removedItem);
        effectMessage += `, nhưng bạn đã mất ${removedItem}!`;
      }
    }
    alert(effectMessage);
  } else if (selectedItem === "Sách") {
    startInteraction("Đọc sách", 10, async () => {
      petData.happiness = Math.min(petData.happiness + 20, 100);
      petData.energy = Math.max(petData.energy - 5, 0);
      const expMultiplier = 1 + (petData.level - 1) * 0.1;
      petData.exp += 20 * expMultiplier;
      userData.gold += 5;
      petData.lastUpdated = serverTimestamp();
      await updatePet();
      populateItems();
      displayPet();
    });
    return;
  } else if (selectedItem === "Ván trượt tuyết") {
    startInteraction("Trượt tuyết", 8, async () => {
      petData.happiness = Math.min(petData.happiness + 25, 100);
      petData.energy = Math.max(petData.energy - 10, 0);
      petData.cleanliness = Math.max(petData.cleanliness - 5, 0);
      const expMultiplier = 1 + (petData.level - 1) * 0.1;
      petData.exp += 15 * expMultiplier;
      userData.gold += 8;
      petData.lastUpdated = serverTimestamp();
      await updatePet();
      populateItems();
      displayPet();
    });
    return;
  }

  userData.items = userData.items.filter((item) => item !== selectedItem);
  await updatePet();
  populateItems();
  displayPet();
};

// Function to show the shop dialog
window.showShop = () => {
  elements.shopDialog.style.display = "block";
  elements.shopOverlay.style.display = "block";
};

// Function to close the shop dialog
window.closeShop = () => {
  elements.shopDialog.style.display = "none";
  elements.shopOverlay.style.display = "none";
};

// Function to buy an item from the shop
window.buyItem = async (itemName, cost) => {
  if (userData.gold < cost) {
    alert("Bạn không đủ vàng để mua vật phẩm này!");
    return;
  }

  userData.gold -= cost;
  userData.items.push(itemName);
  alert(`Bạn đã mua ${itemName}!`);

  await updatePet();
  populateItems();
  displayPet();
};

// Function to show the pet info dialog
window.showDialog = () => {
  elements.infoDialog.style.display = "block";
  elements.overlay.style.display = "block";
};

// Function to close the pet info dialog
window.closeDialog = () => {
  elements.infoDialog.style.display = "none";
  elements.overlay.style.display = "none";
};

// Function to confirm pet deletion
window.confirmDeletePet = () => {
  if (
    window.confirm(
      `Bạn có chắc chắn muốn gửi ${petData.petName} vào trung tâm? Hành động này không thể hoàn tác!`,
    )
  ) {
    deletePet(false);
  } else {
    closeDialog();
  }
};

window.addEventListener("beforeunload", () => {
  if (updateInterval) clearInterval(updateInterval);
});

// Function to handle user logout
window.handleLogout = async function () {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    try {
      await signOut(auth);
      localStorage.removeItem("tamagotchiCredentials");
      window.location.href = "../index.html";
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      alert("Lỗi đăng xuất: " + error.message);
    }
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (uid && uid === user.uid) {
      loadPet();
    } else {
      alert("UID không hợp lệ! Vui lòng đăng nhập lại.");
      window.location.href = "../index.html";
    }
  } else {
    window.location.href = "../index.html";
  }
});
