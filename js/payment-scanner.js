// ============================================================
// js/payment-scanner.js - Payment Scanner (Phase 6)
// ============================================================

import { handlePaymentSuccess } from './enrollment.js';

// ============================================================
// PAYMENT LINK - Your Nomod payment URL
// ============================================================
var PAYMENT_URL = 'https://pay.nomodapp.com/en/l/8ea80e8e835c4b86';

// ============================================================
// Initialize Event Listeners
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // --- Button: Pay with Nomod ---
    var payBtn = document.getElementById('payWithNomodBtn');
    if (payBtn) {
        payBtn.addEventListener('click', function() {
            window.open(PAYMENT_URL, '_blank');
            
            var statusEl = document.getElementById('scannerStatus');
            if (statusEl) {
                statusEl.innerHTML = '💳 Payment window opened. <br>After completing payment, click the <strong>"Confirm Payment"</strong> button below.';
                statusEl.style.color = '#6C3CE1';
                statusEl.style.background = '#f0e6ff';
                statusEl.style.border = '1px solid #6C3CE1';
            }

            var confirmBtn = document.getElementById('manualConfirmBtn');
            if (confirmBtn) {
                confirmBtn.style.display = 'inline-block';
            }
        });
    }

    // --- Button: Confirm Payment Manually ---
    var confirmBtn = document.getElementById('manualConfirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            var statusEl = document.getElementById('scannerStatus');
            if (statusEl) {
                statusEl.innerHTML = '✅ Payment confirmed successfully!';
                statusEl.style.color = '#22c55e';
                statusEl.style.background = '#e8f5e9';
                statusEl.style.border = '1px solid #22c55e';
            }

            var paymentDetails = {
                method: 'nomod_manual',
                transactionId: 'NOMOD-' + Date.now(),
                amount: '450',
                timestamp: new Date().toISOString()
            };
            
            handlePaymentSuccess(paymentDetails);
        });
    }

    // --- Button: Upload QR Code (Simulated for testing) ---
    var uploadBtn = document.getElementById('uploadQRBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            var statusEl = document.getElementById('scannerStatus');
            if (statusEl) {
                statusEl.textContent = '📤 QR Code uploaded and verified!';
                statusEl.style.color = '#22c55e';
                statusEl.style.background = '#e8f5e9';
                statusEl.style.border = '1px solid #22c55e';
            }

            var paymentDetails = {
                method: 'qr_upload',
                transactionId: 'QR-' + Date.now(),
                amount: '450',
                timestamp: new Date().toISOString()
            };
            
            handlePaymentSuccess(paymentDetails);
        });
    }

    // --- Button: Simulate QR Scan (For testing) ---
    var scanBtn = document.getElementById('scanQRBtn');
    if (scanBtn) {
        scanBtn.addEventListener('click', function() {
            var statusEl = document.getElementById('scannerStatus');
            if (statusEl) {
                statusEl.textContent = '📷 QR Code scanned successfully!';
                statusEl.style.color = '#22c55e';
                statusEl.style.background = '#e8f5e9';
                statusEl.style.border = '1px solid #22c55e';
            }

            var paymentDetails = {
                method: 'qr_scan',
                transactionId: 'QR-' + Date.now(),
                amount: '450',
                timestamp: new Date().toISOString()
            };
            
            handlePaymentSuccess(paymentDetails);
        });
    }
});

export { PAYMENT_URL };
