// THEME TOGGLE (Desktop + Sidebar)
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute("data-theme") === "dark";

    if (isDark) {
        html.setAttribute("data-theme", "light");
    } else {
        html.setAttribute("data-theme", "dark");
    }

    const desktopBtn = document.getElementById("themeBtn");
    const sidebarBtn = document.getElementById("sidebarThemeBtn");
    const newText = isDark ? "Light Mode" : "Dark Mode";

    if (desktopBtn) desktopBtn.textContent = newText;
    if (sidebarBtn) sidebarBtn.textContent = newText;
}

// SIDEBAR TOGGLE
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");

// OPEN / CLOSE SIDEBAR
menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
});

// CLOSE WHEN CLICKING OVERLAY
overlay.addEventListener("click", () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
});

// SEARCH & VOICE (Recipe Cards)
function filterCards() {
    const input = document.getElementById("searchInput");
    if (!input) return;
    const term = input.value.toLowerCase();
    document.querySelectorAll(".recipe-card").forEach((card) => {
        const title = card.querySelector("h3")?.textContent.toLowerCase() || "";
        card.style.display = title.includes(term) ? "" : "none";
    });
}
function triggerSearch() {
    filterCards();
}

function startVoice() {
    const micBtn = document.getElementById("micBtn");
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        alert("Voice search is not supported in this browser. Try Chrome!");
        return;
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.continuous = false;
    micBtn.classList.add("listening");
    rec.start();
    rec.onresult = (e) => {
        document.getElementById("searchInput").value = e.results[0][0].transcript;
        filterCards();
        micBtn.classList.remove("listening");
    };
    rec.onerror = rec.onend = () => micBtn.classList.remove("listening");
}

// INGREDIENT SYSTEM (Recipe Finder)
let ingredients = [];
const ingredientInput = document.getElementById("ingredientInput");
const ingredientsDisplay = document.getElementById("ingredientsDisplay");

function renderIngredients() {
    if (!ingredientsDisplay) return;
    if (ingredients.length === 0) {
        ingredientsDisplay.innerHTML =
            '<span style="color:#aaa;font-size:13px;">Your ingredients will appear here...</span>';
        return;
    }
    ingredientsDisplay.innerHTML = "";
    ingredients.forEach((item, i) => {
        const chip = document.createElement("div");
        chip.className = "ingredient-chip";
        chip.innerHTML = `${item}<button onclick="removeIngredient(${i})">×</button>`;
        ingredientsDisplay.appendChild(chip);
    });
}

function removeIngredient(i) {
    ingredients.splice(i, 1);
    renderIngredients();
}

function addIngredient(val) {
    const v = val.trim();
    if (v && !ingredients.includes(v)) {
        ingredients.push(v);
        renderIngredients();
    }
    if (ingredientInput) {
        ingredientInput.value = "";
        ingredientInput.focus();
    }
}

function clearIngredients() {
    ingredients = [];
    renderIngredients();
}

if (ingredientInput) {
    ingredientInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addIngredient(ingredientInput.value);
    });
}
document.querySelectorAll("#quickTags button").forEach((btn) => {
    btn.addEventListener("click", () => addIngredient(btn.textContent));
});

// RENDER RECIPE CARDS
function renderCards(meals) {
    const grid = document.getElementById("recipesGrid");
    const countEl = document.getElementById("recipeCount");
    if (!grid) return;
    grid.innerHTML = "";
    if (countEl) countEl.textContent = meals.length + " Recipes Found";
    meals.forEach((meal) => {
        const card = document.createElement("div");
        card.className = "recipe-card";
        card.innerHTML = `
            <div class="recipe-image">
                <img src="${meal.strMealThumb || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800"}" alt="${meal.strMeal}" loading="lazy">
                <span class="difficulty easy">${(meal.strCategory || "RECIPE").toUpperCase()}</span>
            </div>
            <div class="recipe-info">
                <div class="recipe-title-row">
                    <h3>${meal.strMeal}</h3>
                    <button class="plus-btn" title="Save to Cook List">+</button>
                </div>
                <p>${meal.strArea ? meal.strArea + " cuisine · " : ""}Click View for full recipe details.</p>
                <div class="recipe-footer">
                    <span>⭐ ${meal.strArea || "World"}</span>
                    <span class="cook-time">⏱ Varies</span>
                    <button class="view-btn">View</button>
                </div>
            </div>`;
        card
            .querySelector(".view-btn")
            .addEventListener("click", () => openModal(meal.idMeal));
        card
            .querySelector(".plus-btn")
            .addEventListener("click", () => saveToLocalCookList(meal));
        grid.appendChild(card);
    });
}

// GENERATE RECIPES (TheMealDB API)
async function generateRecipes() {
    if (ingredients.length === 0) {
        alert("Please add at least one ingredient first!");
        return;
    }
    const grid = document.getElementById("recipesGrid");
    const countEl = document.getElementById("recipeCount");
    grid.innerHTML =
        '<div class="api-loading"><div class="spinner"></div><p>Finding recipes for your ingredients…</p></div>';
    if (countEl) countEl.textContent = "Searching…";

    try {
        const results = await Promise.all(
            ingredients.map((ing) =>
                fetch(
                    `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ing)}`,
                ).then((r) => r.json()),
            ),
        );
        const mealMap = {};
        results.forEach((res) => {
            (res.meals || []).forEach((meal) => {
                if (!mealMap[meal.idMeal])
                    mealMap[meal.idMeal] = { ...meal, matchCount: 0 };
                mealMap[meal.idMeal].matchCount++;
            });
        });
        const meals = Object.values(mealMap)
            .sort((a, b) => b.matchCount - a.matchCount)
            .slice(0, 12);
        if (meals.length === 0) {
            grid.innerHTML =
                '<div class="api-loading"><p>No recipes found for those ingredients. Try something else!</p></div>';
            if (countEl) countEl.textContent = "0 Recipes Found";
            return;
        }
        renderCards(meals);
    } catch {
        grid.innerHTML =
            '<div class="api-loading"><p>Could not reach the recipe server. Check your connection and try again.</p></div>';
    }
}

// INITIAL LOAD (Featured Recipes)
async function initRecipeFinder() {
    const grid = document.getElementById("recipesGrid");
    if (!grid) return;
    const countEl = document.getElementById("recipeCount");
    grid.innerHTML =
        '<div class="api-loading"><div class="spinner"></div><p>Loading featured recipes…</p></div>';
    try {
        const [chickenRes, seafoodRes] = await Promise.all([
            fetch(
                "https://www.themealdb.com/api/json/v1/1/filter.php?c=Chicken",
            ).then((r) => r.json()),
            fetch(
                "https://www.themealdb.com/api/json/v1/1/filter.php?c=Seafood",
            ).then((r) => r.json()),
        ]);
        const meals = [
            ...(chickenRes.meals || []).slice(0, 3),
            ...(seafoodRes.meals || []).slice(0, 3),
        ].slice(0, 6);
        if (meals.length) renderCards(meals);
        else
            grid.innerHTML =
                '<div class="api-loading"><p>Add your ingredients and click "Generate Recipes" to get started!</p></div>';
    } catch {
        grid.innerHTML =
            '<div class="api-loading"><p>Add your ingredients and click "Generate Recipes" to get started!</p></div>';
    }
}

// REGISTRATION POPUP
const openRegister = document.getElementById("openRegister");
const registerPopup = document.getElementById("registerPopup");
const closePopupBtn = document.getElementById("closePopup");

if (openRegister)
    openRegister.onclick = () => registerPopup.classList.add("active");
if (closePopupBtn)
    closePopupBtn.onclick = () => registerPopup.classList.remove("active");
window.addEventListener("click", (e) => {
    if (e.target === registerPopup) registerPopup.classList.remove("active");
});

// SHOW/HIDE PASSWORD
document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.onclick = () => {
        const input = icon.parentElement.querySelector("input");
        if (input.type === "password") {
            input.type = "text";
            icon.innerHTML = '<i class="fa-solid fa-lock-open"></i>';
        } else {
            input.type = "password";
            icon.innerHTML = '<i class="fa-solid fa-lock"></i>';
        }
    };
});

// REGISTER FORM
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fullName = document.getElementById("fullName").value;
        const email = document.getElementById("email").value;
        const pwd = document.getElementById("password").value;
        const confirmPwd = document.getElementById("confirmPassword").value;
        if (pwd !== confirmPwd) {
            alert("Passwords do not match.");
            return;
        }
        const userData = {
            name: fullName,
            email: email,
            image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        };
        localStorage.setItem("tnt_user", JSON.stringify(userData));
        loadUserProfile();
        alert("Account Created Successfully! 🎉");
        registerPopup.classList.remove("active");
        registerForm.reset();
    });
}

// PROFILE SYSTEM (Desktop + Sidebar)
function loadUserProfile() {
    const user = JSON.parse(localStorage.getItem("tnt_user"));
    if (!user) return;

    // Desktop profile
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profileImage = document.getElementById("profileImage");
    const dropdownImage = document.getElementById("dropdownProfileImage");
    if (profileName) profileName.textContent = user.name;
    if (profileEmail) profileEmail.textContent = user.email;
    if (profileImage) profileImage.src = user.image;
    if (dropdownImage) dropdownImage.src = user.image;

    // Sidebar profile
    const sidebarName = document.getElementById("sidebarProfileName");
    const sidebarEmail = document.getElementById("sidebarProfileEmail");
    const sidebarImage = document.getElementById("sidebarProfileImage");
    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarEmail) sidebarEmail.textContent = user.email;
    if (sidebarImage) sidebarImage.src = user.image;
}

// Desktop profile dropdown
const profileBtn = document.getElementById("profileBtn");
const profileDropdown = document.getElementById("profileDropdown");
if (profileBtn && profileDropdown) {
    profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle("active");
    });
    document.addEventListener("click", (e) => {
        if (!profileDropdown.contains(e.target) && e.target !== profileBtn) {
            profileDropdown.classList.remove("active");
        }
    });
}

// Desktop logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("tnt_user");
        location.reload();
    });
}

// Sidebar logout
const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");
if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener("click", () => {
        localStorage.removeItem("tnt_user");
        location.reload();
    });
}

// Desktop image upload
const desktopUpload = document.getElementById("uploadProfileImage");
if (desktopUpload) {
    desktopUpload.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgData = e.target.result;
            const desktopImg = document.getElementById("profileImage");
            const dropdownImg = document.getElementById("dropdownProfileImage");
            const sidebarImg = document.getElementById("sidebarProfileImage");
            if (desktopImg) desktopImg.src = imgData;
            if (dropdownImg) dropdownImg.src = imgData;
            if (sidebarImg) sidebarImg.src = imgData;
            const user = JSON.parse(localStorage.getItem("tnt_user"));
            if (user) {
                user.image = imgData;
                localStorage.setItem("tnt_user", JSON.stringify(user));
            }
        };
        reader.readAsDataURL(file);
    });
}

// Sidebar image upload
const sidebarUpload = document.getElementById("uploadProfileImageSidebar");
if (sidebarUpload) {
    sidebarUpload.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgData = e.target.result;
            const desktopImg = document.getElementById("profileImage");
            const dropdownImg = document.getElementById("dropdownProfileImage");
            const sidebarImg = document.getElementById("sidebarProfileImage");
            if (desktopImg) desktopImg.src = imgData;
            if (dropdownImg) dropdownImg.src = imgData;
            if (sidebarImg) sidebarImg.src = imgData;
            const user = JSON.parse(localStorage.getItem("tnt_user"));
            if (user) {
                user.image = imgData;
                localStorage.setItem("tnt_user", JSON.stringify(user));
            }
        };
        reader.readAsDataURL(file);
    });
}

// Load user data on page load
loadUserProfile();

// RECIPE MODAL
async function openModal(mealId) {
    const modal = document.getElementById("recipeModal");
    if (!modal) return;
    modal.style.display = "flex";

    if (String(mealId).startsWith("custom_")) {
        const meal = getCookList().find((m) => m.idMeal === mealId);
        if (!meal) return;
        document.getElementById("modalImage").src = meal.strMealThumb || "";
        document.getElementById("modalTitle").textContent = meal.strMeal;
        document.getElementById("modalTime").textContent = "🏠 My Kitchen";
        document.getElementById("modalDifficulty").textContent =
            "🍽️ " + (meal.strCategory || "Custom");
        document.getElementById("modalRating").textContent = "⭐ My Recipe";
        document.getElementById("modalIngredients").innerHTML =
            meal.customIngredients
                .split("\n")
                .filter(Boolean)
                .map((i) => `<li>${i.trim()}</li>`)
                .join("");
        document.getElementById("modalSteps").innerHTML = meal.strInstructions
            .split("\n")
            .filter(Boolean)
            .map((s) => `<li>${s.trim()}</li>`)
            .join("");
        return;
    }

    document.getElementById("modalImage").src = "";
    document.getElementById("modalTitle").textContent = "Loading recipe…";
    document.getElementById("modalIngredients").innerHTML =
        "<li>Fetching details…</li>";
    document.getElementById("modalSteps").innerHTML = "";
    document.getElementById("modalTime").textContent = "";
    document.getElementById("modalDifficulty").textContent = "";
    document.getElementById("modalRating").textContent = "";

    try {
        const res = await fetch(
            `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`,
        );
        const data = await res.json();
        const meal = data.meals[0];
        const ingList = [];
        for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`];
            const meas = meal[`strMeasure${i}`];
            if (ing && ing.trim())
                ingList.push(`${meas ? meas.trim() + " " : ""}${ing.trim()}`);
        }
        const steps = meal.strInstructions
            .split(/\r\n\r\n|\r\n|\n/)
            .map((s) => s.replace(/^\s*\d+[\.\)]\s*/, "").trim())
            .filter((s) => s.length > 8);
        document.getElementById("modalImage").src = meal.strMealThumb;
        document.getElementById("modalTitle").textContent = meal.strMeal;
        document.getElementById("modalTime").textContent =
            "🌍 " + (meal.strArea || "World");
        document.getElementById("modalDifficulty").textContent =
            "🍽️ " + (meal.strCategory || "Main");
        document.getElementById("modalRating").textContent = "⭐ TheMealDB";
        document.getElementById("modalIngredients").innerHTML = ingList
            .map((i) => `<li>${i}</li>`)
            .join("");
        document.getElementById("modalSteps").innerHTML = steps
            .map((s) => `<li>${s}</li>`)
            .join("");
    } catch {
        document.getElementById("modalTitle").textContent =
            "Error loading recipe. Please try again.";
    }
}

const closeModalBtn = document.getElementById("closeModal");
const recipeModal = document.getElementById("recipeModal");
if (closeModalBtn)
    closeModalBtn.onclick = () => (recipeModal.style.display = "none");
if (recipeModal)
    window.addEventListener("click", (e) => {
        if (e.target === recipeModal) recipeModal.style.display = "none";
    });

// PRINT RECIPE
function printRecipe() {
    const content = document.querySelector(".recipe-modal-content").innerHTML;
    const w = window.open("", "", "width=900,height=700");
    w.document.write(`<html><head><title>Print Recipe</title>
<style>body{font-family:Poppins,sans-serif;padding:30px;}img{width:100%;max-height:280px;object-fit:cover;border-radius:12px;}
h1{color:#1A2F2A;}h2{color:#E6A017;margin-top:18px;}li{margin-bottom:8px;line-height:26px;}
.print-btn,.close-modal{display:none;}</style></head>
<body>${content}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
}

// COOK LIST (localStorage)
function getCookList() {
    return JSON.parse(localStorage.getItem("tnt_cookList") || "[]");
}
function saveCookList(list) {
    localStorage.setItem("tnt_cookList", JSON.stringify(list));
}

function saveToLocalCookList(meal) {
    const list = getCookList();
    if (list.find((m) => m.idMeal === meal.idMeal)) {
        alert(`"${meal.strMeal}" is already in your Cook List!`);
        return;
    }
    list.push(meal);
    saveCookList(list);
    alert(`"${meal.strMeal}" added to your Cook List! ✅`);
}

function renderCookList() {
    const grid = document.getElementById("cookListGrid");
    const countEl = document.getElementById("cookListCount");
    if (!grid) return;
    const list = getCookList();
    if (countEl) countEl.textContent = list.length + " Saved Recipes";
    grid.innerHTML = "";
    if (list.length === 0) {
        grid.innerHTML =
            '<div class="api-loading"><p>Your Cook List is empty.<br>Save recipes from the Recipe Finder, or add your own using the form!</p></div>';
        return;
    }
    list.forEach((meal, index) => {
        const card = document.createElement("div");
        card.className = "recipe-card";
        card.innerHTML = `
            <div class="recipe-image">
                <img src="${meal.strMealThumb || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800"}" alt="${meal.strMeal}" loading="lazy">
                <span class="difficulty ${meal.isCustom ? "medium" : "easy"}">${meal.isCustom ? "CUSTOM" : (meal.strCategory || "SAVED").toUpperCase()}</span>
            </div>
            <div class="recipe-info">
                <div class="recipe-title-row">
                    <h3>${meal.strMeal}</h3>
                    <button class="plus-btn" style="background:var(--sage);color:white;" onclick="removeCookListItem(${index})" title="Remove from Cook List">×</button>
                </div>
                <p>${meal.isCustom ? "My custom recipe" : meal.strArea ? meal.strArea + " cuisine" : "Saved recipe"}</p>
                <div class="recipe-footer">
                    <span>⭐ ${meal.isCustom ? "My Recipe" : meal.strArea || "World"}</span>
                    <span class="cook-time">⏱ Varies</span>
                    <button class="view-btn" onclick="openModal('${meal.idMeal}')">View</button>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

function removeCookListItem(index) {
    const list = getCookList();
    if (!confirm(`Remove "${list[index]?.strMeal}" from your Cook List?`)) return;
    list.splice(index, 1);
    saveCookList(list);
    renderCookList();
}

function addCustomRecipe() {
    const titleEl = document.getElementById("customTitle");
    const ingrEl = document.getElementById("customIngredients");
    const stepsEl = document.getElementById("customSteps");
    const imgEl = document.getElementById("customImage");
    const catEl = document.getElementById("customCategory");
    const title = titleEl?.value.trim();
    const ingr = ingrEl?.value.trim();
    const steps = stepsEl?.value.trim();
    if (!title || !ingr || !steps) {
        alert("Please fill in the Recipe Name, Ingredients, and Steps fields.");
        return;
    }
    const list = getCookList();
    list.push({
        idMeal: "custom_" + Date.now(),
        strMeal: title,
        strMealThumb:
            imgEl?.value.trim() ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800",
        strCategory: catEl?.value || "Custom",
        strArea: "My Kitchen",
        strInstructions: steps,
        customIngredients: ingr,
        isCustom: true,
    });
    saveCookList(list);
    if (titleEl) titleEl.value = "";
    if (ingrEl) ingrEl.value = "";
    if (stepsEl) stepsEl.value = "";
    if (imgEl) imgEl.value = "";
    if (catEl) catEl.value = "Custom";
    renderCookList();
    alert(`"${title}" added to your Cook List! ✅`);
}

function clearCookForm() {
    ["customTitle", "customIngredients", "customSteps", "customImage"].forEach(
        (id) => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        },
    );
    const catEl = document.getElementById("customCategory");
    if (catEl) catEl.value = "Custom";
}

// ACTIVE NAV LINK ON SCROLL
window.addEventListener("scroll", () => {
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-links a");
    let current = "";
    sections.forEach((section) => {
        const sectionTop = section.offsetTop - 120;
        if (window.scrollY >= sectionTop) current = section.getAttribute("id");
    });
    navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href").includes(current))
            link.classList.add("active");
    });
});

// DEVELOPER POPUP
document.addEventListener("DOMContentLoaded", () => {
    const developerCards = document.querySelectorAll(".developer-card");
    const popup = document.getElementById("developerPopup");
    const popupImg = document.getElementById("popupImg");
    const popupName = document.getElementById("popupName");
    const popupRole = document.getElementById("popupRole");
    const popupDesc = document.getElementById("popupDescription");
    const fbLink = document.getElementById("facebookLink");
    const igLink = document.getElementById("instagramLink");
    const ttLink = document.getElementById("tiktokLink");

    // Redirect Explore button
    const exploreBtn = document.getElementById("exploreBtn");
    if (exploreBtn)
        exploreBtn.addEventListener(
            "click",
            () => (window.location.href = "TNTRecipeFinder.html"),
        );

    if (developerCards.length && popup) {
        developerCards.forEach((card) => {
            card.addEventListener("click", () => {
                popup.classList.add("active");
                popupImg.src = card.dataset.img;
                popupName.textContent = card.dataset.name;
                popupRole.textContent = card.dataset.role;
                popupDesc.textContent = card.dataset.description;
                fbLink.href = card.dataset.facebook;
                igLink.href = card.dataset.instagram;
                ttLink.href = card.dataset.tiktok;
            });
        });
        popup.addEventListener("click", (e) => {
            if (e.target === popup) popup.classList.remove("active");
        });
    }

    const closeDevPopup = document.querySelector(".close-dev-popup");
    if (closeDevPopup)
        closeDevPopup.addEventListener("click", () =>
            popup?.classList.remove("active"),
        );
});

// INITIALIZE PAGE-SPECIFIC FEATURES
if (document.getElementById("recipesGrid")) initRecipeFinder();
if (document.getElementById("cookListGrid")) renderCookList();