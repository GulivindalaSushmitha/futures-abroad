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
                statusEl.style.color = '#6C3CE1';
                statusEl.style.background = '#f0e6ff';
                statusEl.style.border = '1px solid #6C3CE1';
            }

            // Show the manual confirmation button
            const confirmBtn = document.getElementById('manualConfirmBtn');
            if (confirmBtn) {
                confirmBtn.style.display = 'inline-block';
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
                statusEl.style.color = '#22c55e';
                statusEl.style.background = '#e8f5e9';
                statusEl.style.border = '1px solid #22c55e';
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
                statusEl.style.color = '#22c55e';
                statusEl.style.background = '#e8f5e9';
                statusEl.style.border = '1px solid #22c55e';
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
                statusEl.style.color = '#22c55e';
                statusEl.style.background = '#e8f5e9';
                statusEl.style.border = '1px solid #22c55e';
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
// Exports
// ============================================================
export { PAYMENT_URL };
