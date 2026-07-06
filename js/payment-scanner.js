// ============================================================
// js/payment-scanner.js - Payment Scanner (Phase 6)
// ============================================================

import { handlePaymentSuccess } from './enrollment.js';

// ============================================================
// PAYMENT LINK - Your Nomod payment URL
// ============================================================
const PAYMENT_URL = 'https://pay.nomodapp.com/en/l/8ea80e8e835c4b86';

// ============================================================
// Initialize Event Listeners
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // --- Button: Pay with Nomod (Opens payment link) ---
    const payBtn = document.getElementById('payWithNomodBtn');
    if (payBtn) {
        payBtn.addEventListener('click', () => {
            // Open the payment link in a new tab/window
            window.open(PAYMENT_URL, '_blank');
            
            // Update status
            const statusEl = document.getElementById('scannerStatus');
            if (statusEl) {
                statusEl.innerHTML = `
                    💳 Payment window opened. 
                    <br>After completing payment, click the <strong>"Confirm Payment"</strong> button below.
                `;
                statusEl.style.color = '#667eea';
            }

            // Show the manual confirmation button
            const confirmBtn = document.getElementById('manualConfirmBtn');
            if (confirmBtn) {
                confirmBtn.style.display = 'inline-block';
                confirmBtn.style.animation = 'pulse 1.5s infinite';
            }
        });
    }

    // --- Button: Confirm Payment Manually ---
    const confirmBtn = document.getElementById('manualConfirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const statusEl = document.getElementById('scannerStatus');
            if (statusEl) {
                statusEl.innerHTML = '✅ Payment confirmed successfully!';
                statusEl.style.color = '#2ecc71';
            }

            // Create payment details
            const paymentDetails = {
                method: 'nomod_manual',
                transactionId: 'NOMOD-' + Date.now(),
                amount: '450',
                timestamp: new Date().toISOString()
            };
            
            // Call the success handler from enrollment.js
            handlePaymentSuccess(paymentDetails);
        });
    }

    // --- Button: Upload QR Code (Simulated for testing) ---
    const uploadBtn = document.getElementById('uploadQRBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            const statusEl = document.getElementById('scannerStatus');
            if (statusEl) {
                statusEl.textContent = '📤 QR Code uploaded and verified!';
                statusEl.style.color = '#2ecc71';
            }

            const paymentDetails = {
                method: 'qr_upload',
                transactionId: 'QR-' + Date.now(),
                amount: '450',
                timestamp: new Date().toISOString()
            };
            
            handlePaymentSuccess(paymentDetails);
        });
    }

    // --- Button: Simulate QR Scan (For testing) ---
    const scanBtn = document.getElementById('scanQRBtn');
    if (scanBtn) {
        scanBtn.addEventListener('click', () => {
            const statusEl = document.getElementById('scannerStatus');
            if (statusEl) {
                statusEl.textContent = '📷 QR Code scanned successfully!';
                statusEl.style.color = '#2ecc71';
            }

            const paymentDetails = {
                method: 'qr_scan',
                transactionId: 'QR-' + Date.now(),
                amount: '450',
                timestamp: new Date().toISOString()
            };
            
            handlePaymentSuccess(paymentDetails);
        });
    }
});

// ============================================================
// Add pulse animation for the confirm button
// ============================================================
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(46, 204, 113, 0.4); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// ============================================================
// Exports
// ============================================================
export { PAYMENT_URL };
