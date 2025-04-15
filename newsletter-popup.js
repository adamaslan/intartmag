(function() {
    // Create popup elements (keep existing HTML structure)
    const popupHTML = `
    <div class="newsletter-popup-overlay" id="newsletterPopup" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    ">
        <div class="newsletter-popup-content" style="
            width: 33%;
            min-width: 300px;
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            position: relative;
        ">
            <button class="newsletter-close-btn" style="
                position: absolute;
                top: 10px;
                right: 15px;
                font-size: 24px;
                cursor: pointer;
                background: none;
                border: none;
            ">&times;</button>
            <h2 style="margin-top: 0;">Join Our Newsletter</h2>
            <form id="newsletterForm">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label for="newsletterEmail" style="display: block; margin-bottom: 5px;">Email Address*</label>
                    <input type="email" id="newsletterEmail" name="email" required style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        box-sizing: border-box;
                    ">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label for="newsletterFname" style="display: block; margin-bottom: 5px;">First Name</label>
                    <input type="text" id="newsletterFname" name="fname" style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        box-sizing: border-box;
                    ">
                </div>
                <button type="submit" style="
                    background: #2c9ab7;
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    width: 100%;
                    font-weight: bold;
                ">Subscribe</button>
            </form>
            <div id="newsletterMessage" style="
                margin-top: 15px;
                padding: 10px;
                border-radius: 4px;
                display: none;
            "></div>
        </div>
    </div>`;

    // Add popup to the page
    document.body.insertAdjacentHTML('beforeend', popupHTML);

    // Get elements
    const popup = document.getElementById('newsletterPopup');
    const closeBtn = document.querySelector('.newsletter-close-btn');
    const form = document.getElementById('newsletterForm');
    const messageDiv = document.getElementById('newsletterMessage');

    // Show popup after 3 seconds
    setTimeout(() => {
        popup.style.display = 'flex';
    }, 3000);

    // Close button functionality
    closeBtn.addEventListener('click', () => {
        popup.style.display = 'none';
    });

    // Close when clicking outside
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.style.display = 'none';
        }
    });

    // Form submission - ConvertKit version
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('newsletterEmail').value;
        const fname = document.getElementById('newsletterFname').value;
        
        messageDiv.style.display = 'none';
        
        // Create hidden ConvertKit form
        const convertKitForm = document.createElement('form');
        convertKitForm.style.display = 'none';
        convertKitForm.method = 'POST';
        convertKitForm.action = 'https://api.convertkit.com/v3/forms/YOUR_FORM_ID/subscribe';
        
        // Add required fields
        const emailInput = document.createElement('input');
        emailInput.type = 'hidden';
        emailInput.name = 'email';
        emailInput.value = email;
        convertKitForm.appendChild(emailInput);
        
        const nameInput = document.createElement('input');
        nameInput.type = 'hidden';
        nameInput.name = 'first_name';
        nameInput.value = fname;
        convertKitForm.appendChild(nameInput);
        
        const apiKeyInput = document.createElement('input');
        apiKeyInput.type = 'hidden';
        apiKeyInput.name = 'api_key';
        apiKeyInput.value = 'YOUR_CONVERTKIT_API_KEY';
        convertKitForm.appendChild(apiKeyInput);
        
        // Add form to page and submit
        document.body.appendChild(convertKitForm);
        convertKitForm.submit();
        
        // Show success message
        messageDiv.style.display = 'block';
        messageDiv.style.backgroundColor = '#d4edda';
        messageDiv.style.color = '#155724';
        messageDiv.textContent = 'Thank you for subscribing!';
        form.reset();
        
        // Close popup after 3 seconds
        setTimeout(() => {
            popup.style.display = 'none';
        }, 3000);
    });
})();