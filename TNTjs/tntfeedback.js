document.addEventListener("DOMContentLoaded", () => {

    // INITIALIZE ICONS
    lucide.createIcons();

    // DOM ELEMENT SELECTION
    const modal = document.getElementById("tntReviewModal");
    const leaveReviewBtn = document.getElementById("tntLeaveReviewBtn");
    const closeModalBtn = document.getElementById("tntCloseModalBtn");
    const reviewForm = document.getElementById("tntReviewForm");
    const reviewsContainer = document.getElementById("tntReviewsContainer");
    const starRatingContainer = document.getElementById("tntStarRatingInput");
    const reviewRatingInput = document.getElementById("tntReviewRating");

    // Track the currently selected rating (defaults to 5)
    let currentRating = 5;

    // MODAL TOGGLE LOGIC
    function openModal() {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
        highlightStars(5);
    }

    function closeModal() {
        modal.classList.remove("active");
        document.body.style.overflow = "";
        reviewForm.reset();
        currentRating = 5;
        reviewRatingInput.value = 5;
    }

    // Event Listeners for opening and closing
    leaveReviewBtn.addEventListener("click", openModal);
    closeModalBtn.addEventListener("click", closeModal);

    // Close the modal if the user clicks on the dark background overlay
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });


    // INTERACTIVE STAR RATING LOGIC
    starRatingContainer.addEventListener("mouseover", (e) => {
        const svg = e.target.closest("svg");
        if (!svg) return;
        const ratingValue = svg.getAttribute("data-value");
        highlightStars(ratingValue);
    });

    starRatingContainer.addEventListener("mouseout", () => {
        highlightStars(currentRating);
    });

    // When clicking a star, save that rating permanently 
    starRatingContainer.addEventListener("click", (e) => {
        const svg = e.target.closest("svg");
        if (!svg) return;
        currentRating = parseInt(svg.getAttribute("data-value"), 10);
        reviewRatingInput.value = currentRating;
        highlightStars(currentRating);
    });

    // Helper function to color in the correct number of stars
    function highlightStars(rating) {
        const stars = starRatingContainer.querySelectorAll("svg");
        stars.forEach((star) => {
            const starValue = parseInt(star.getAttribute("data-value"), 10);

            // If the star's value is less than or equal to the target rating, fill it
            if (starValue <= rating) {
                star.classList.add("active");
                star.style.fill = "currentColor";
            } else {
                star.classList.remove("active");
                star.style.fill = "none";
            }
        });
    }

    // Ensure modal starts with 5 stars filled out on page load
    setTimeout(() => highlightStars(5), 100);

    // FORM SUBMISSION & REAL-TIME UPDATE
    reviewForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // Grab values from the form inputs
        const name = document.getElementById("tntReviewerName").value;
        const comment = document.getElementById("tntReviewComment").value;
        const rating = parseInt(reviewRatingInput.value, 10);

        // Create a new div element to hold our review
        const newCard = document.createElement("div");
        newCard.className = "tnt-review-card";

        // Build the HTML string for the correct number of stars
        let starsHtml = "";
        for (let i = 1; i <= 5; i++) {
            // Inline style logic: fill it if it's within the rating, else make it empty
            const fillStyle = i <= rating ? "currentColor" : "none";
            starsHtml += `<i data-lucide="star" style="fill: ${fillStyle};"></i>`;
        }

        // Inject the HTML structure matching our grid design
        newCard.innerHTML = `
      <div class="tnt-card-inner-top">
        <div class="tnt-avatar">
          <i data-lucide="user"></i>
        </div>
        <div class="tnt-user-info">
          <span class="tnt-name">${name}</span>
          <div class="tnt-stars">
            ${starsHtml}
          </div>
        </div>
      </div>
      <p class="tnt-review-text">${comment}</p>
    `;

        // Insert the new card at the very beginning of the container
        reviewsContainer.insertBefore(newCard, reviewsContainer.firstChild);

        // Tell Lucide to convert the new <i> tags we just injected into actual SVGs
        lucide.createIcons({ root: newCard });

        // Close the modal, which will also clear the form
        closeModal();
    });
});
