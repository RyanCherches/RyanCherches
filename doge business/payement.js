// Payment Form Handler
document.addEventListener('DOMContentLoaded', function () {
    const paymentForm = document.getElementById('paymentForm');
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryInput = document.getElementById('expiry');
    const cvcInput = document.getElementById('cvc');
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

    // Format card number with spaces
    cardNumberInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.replace(/(\d{4})/g, '$1 ').trim();
        e.target.value = formattedValue.slice(0, 19);
    });

    // Format expiry date (MM/YY)
    expiryInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
    });

    // Allow only numbers for CVC
    cvcInput.addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });

    // Allow only numbers for zip code
    const zipInput = document.getElementById('zip');
    zipInput.addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    // Form validation and submission
    paymentForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validate form fields
        if (!validateForm()) {
            return;
        }

        // Validate card number (Luhn algorithm)
        if (!validateCardNumber(cardNumberInput.value)) {
            showError('cardNumber', 'Invalid card number');
            return;
        }

        // Validate expiry date
        if (!validateExpiry(expiryInput.value)) {
            showError('expiry', 'Invalid expiry date');
            return;
        }

        // Validate CVC
        if (cvcInput.value.length < 3) {
            showError('cvc', 'CVC must be 3 or 4 digits');
            return;
        }

        // If all validations pass, process payment
        processPayment();
    });

    // Form validation function
    function validateForm() {
        const requiredFields = paymentForm.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                showError(field.id, 'This field is required');
                isValid = false;
            } else {
                clearError(field.id);
            }
        });

        return isValid;
    }

    // Validate card number using Luhn algorithm
    function validateCardNumber(cardNumber) {
        const digits = cardNumber.replace(/\D/g, '');
        if (digits.length < 13 || digits.length > 19) {
            return false;
        }

        let sum = 0;
        let isEven = false;

        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = parseInt(digits[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }

    // Validate expiry date
    function validateExpiry(expiry) {
        const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!regex.test(expiry)) {
            return false;
        }

        const [month, year] = expiry.split('/');
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;

        const expiryYear = parseInt(year);
        const expiryMonth = parseInt(month);

        if (expiryYear < currentYear) {
            return false;
        }

        if (expiryYear === currentYear && expiryMonth < currentMonth) {
            return false;
        }

        return true;
    }

    // Show error message for a field
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        
        // Remove existing error if present
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add error styling
        field.style.borderColor = '#e74c3c';
        field.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';

        // Add error message
        const errorMsg = document.createElement('p');
        errorMsg.className = 'error-message';
        errorMsg.textContent = message;
        errorMsg.style.color = '#e74c3c';
        errorMsg.style.fontSize = '0.85em';
        errorMsg.style.marginTop = '5px';
        formGroup.appendChild(errorMsg);
    }

    // Clear error message for a field
    function clearError(fieldId) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        const errorMsg = formGroup.querySelector('.error-message');

        if (errorMsg) {
            errorMsg.remove();
        }

        field.style.borderColor = '#ddd';
        field.style.boxShadow = 'none';
    }

    // Process payment
    function processPayment() {
        const fullName = document.getElementById('fullName').value;
        const selectedItems = [];
        
        productCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const productItem = checkbox.closest('.product-item');
                const productName = productItem.querySelector('.product-info label').textContent;
                selectedItems.push(productName);
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

        // Simulate payment processing
        setTimeout(() => {
            const total = document.getElementById('totalPrice').textContent;
            // Show success message
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

            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }, 2000);
    }
});
