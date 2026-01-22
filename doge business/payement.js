// Payment Form Handler
document.addEventListener('DOMContentLoaded', function () {
    let emailJsAttempts = 0;
    // Wait for EmailJS to be available
    const checkEmailJS = setInterval(() => {
        emailJsAttempts++;
        if (typeof emailjs !== 'undefined') {
            clearInterval(checkEmailJS);
            try {
                emailjs.init('2Ydg93E9zTePCk89r');
                console.log('EmailJS initialized');
            } catch (err) {
                console.error('EmailJS init error:', err);
            }
        } else if (emailJsAttempts === 100) {
            console.warn('EmailJS still not available after ~5s; emails will fallback.');
        }
    }, 50);
    
    const paymentForm = document.getElementById('paymentForm');
    const productCheckboxes = document.querySelectorAll('.product-item input[type="checkbox"]');
    const productItems = document.querySelectorAll('.product-item');

    const SHIPPING_COST = 5.00;

    // Handle product selection
    productCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const productItem = this.closest('.product-item');
            if (this.checked) {
                productItem.classList.add('selected');
            } else {
                productItem.classList.remove('selected');
            }
            updateOrderSummary();
        });
    });

    // Allow clicking on product item to toggle checkbox
    productItems.forEach(item => {
        item.addEventListener('click', function (e) {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = this.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    });

    // Update order summary
    function updateOrderSummary() {
        let subtotal = 0;
        const selectedItems = [];

        productCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const price = parseFloat(checkbox.value);
                const productItem = checkbox.closest('.product-item');
                const productName = productItem.querySelector('.product-info label').textContent;
                
                subtotal += price;
                selectedItems.push({ name: productName, price: price });
            }
        });

        // Update selected items display
        const selectedItemsDiv = document.getElementById('selectedItems');
        selectedItemsDiv.innerHTML = '';

        selectedItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'order-item';
            itemDiv.innerHTML = `<span>${item.name}</span><span>$${item.price.toFixed(2)}</span>`;
            selectedItemsDiv.appendChild(itemDiv);
        });

        // Update subtotal
        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;

        // Update total
        const total = subtotal + SHIPPING_COST;
        document.getElementById('totalPrice').textContent = `$${total.toFixed(2)}`;
    }

    // Initialize order summary on page load
    updateOrderSummary();

    // Form validation and submission
    paymentForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Get the name input
        const nameInput = document.querySelector('input[name="first and last name"]');
        
        // Validate that name is provided
        if (!nameInput.value.trim()) {
            alert('Please enter your name');
            return;
        }

        // Validate that at least one product is selected
        const selectedCheckboxes = document.querySelectorAll('.product-item input[type="checkbox"]:checked');
        if (selectedCheckboxes.length === 0) {
            alert('Please select at least one product');
            return;
        }

        // If all validations pass, process payment
        processPayment();
    });

    // Process payment
    function processPayment() {
        const nameInput = document.querySelector('input[name="first and last name"]');
        const fullName = nameInput.value.trim();
        const selectedItems = [];
        const selectedItemsWithPrice = [];
        
        productCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const productItem = checkbox.closest('.product-item');
                const productName = productItem.querySelector('.product-info label').textContent;
                const productPrice = checkbox.value;
                selectedItems.push(productName);
                selectedItemsWithPrice.push(`${productName} - $${productPrice}`);
            }
        });

        if (selectedItems.length === 0) {
            alert('Please select at least one product');
            return;
        }
        
        // Disable button and show loading state
        const submitBtn = paymentForm.querySelector('.payment-button');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        // Prepare email data
        const total = document.getElementById('totalPrice').textContent;
        const emailContent = `Customer Name: ${fullName}\n\nOrdered Items:\n${selectedItemsWithPrice.join('\n')}\n\nShipping: $5.00\nTotal: ${total}\n\nPayment Status: Completed`;

        // Send email (single recipient)
        const emailParams = {
            to_email: 'rfcherches@mcdonogh.org',
            customer_name: fullName,
            order_items: selectedItemsWithPrice.join(', '),
            total_amount: total,
            message: emailContent
        };

        // Check if EmailJS is available
        if (typeof emailjs !== 'undefined') {
            console.log('Sending email via EmailJS...', { emailParams });
            emailjs.send('service_doge_business', 'template_doge_payment', emailParams)
                .then(function(response) {
                    console.log('EmailJS send response:', response);
                    // Show success message
                    alert(`Thank you for your purchase, ${fullName}!\n\nItems: ${selectedItems.join(', ')}\nTotal: ${total}\n\nYour payment has been processed successfully.\n\nConfirmation email sent to our team.`);
                    
                    // Reset form
                    paymentForm.reset();
                    productCheckboxes.forEach(checkbox => {
                        checkbox.checked = false;
                        checkbox.closest('.product-item').classList.remove('selected');
                    });
                    updateOrderSummary();
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;

                    // Redirect to home page after a short delay
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                })
                .catch(function(error) {
                    console.error('Email sending failed:', error);
                    // Show error details to help debugging
                    alert('Order processed but email failed to send. Check console for details.');
                    
                    // Reset form
                    paymentForm.reset();
                    productCheckboxes.forEach(checkbox => {
                        checkbox.checked = false;
                        checkbox.closest('.product-item').classList.remove('selected');
                    });
                    updateOrderSummary();
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;

                    // Redirect to home page after a short delay
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                });
        } else {
            // EmailJS not available, process payment anyway
            alert(`Thank you for your purchase, ${fullName}!\n\nItems: ${selectedItems.join(', ')}\nTotal: ${total}\n\nYour payment has been processed successfully.`);
            
            // Reset form
            paymentForm.reset();
            productCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
                checkbox.closest('.product-item').classList.remove('selected');
            });
            updateOrderSummary();
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;

            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }
    }
});