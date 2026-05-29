// TOP DISHES GALLERY INTERACTION MECHANICS
document.addEventListener('DOMContentLoaded', () => {
    const galleryCards = document.querySelectorAll('.gallery-card');

    galleryCards.forEach(selectedCard => {
        selectedCard.addEventListener('click', () => {

            // Remove active identifiers from panels
            galleryCards.forEach(otherCard => {
                otherCard.classList.remove('active');
            });

            // Apply active selection state on element focus click
            selectedCard.classList.add('active');
        });
    });
});