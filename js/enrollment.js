// ============================================================
// js/enrollment.js - Enrollment & Payment (Phase 6)
// ============================================================

import { db, auth, COLLECTIONS, collection, doc, getDoc, setDoc, updateDoc, addDoc, serverTimestamp, onAuthStateChanged } from './firebase-config.js';

var selectedProgram = null;
var userProfile = null;

// ============================================================
// Initialize Page
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    onAuthStateChanged(auth, async function(user) {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        await loadUserProfile(user.uid);
        setupProgramSelection();
        setupEnrollmentForm();
    });
});

// ============================================================
// Load User Profile from Firestore
// ============================================================
async function loadUserProfile(userId) {
    try {
        var userDoc = await getDoc(doc(db, COLLECTIONS.users, userId));
        if (userDoc.exists()) {
            userProfile = userDoc.data();
            
            var fullNameInput = document.getElementById('fullName');
            var emailInput = document.getElementById('email');
            var gradeInput = document.getElementById('grade');
            var schoolInput = document.getElementById('school');
            var countryInput = document.getElementById('country');
            
            if (fullNameInput) fullNameInput.value = userProfile.name || '';
            if (emailInput) emailInput.value = userProfile.email || '';
            if (gradeInput) gradeInput.value = userProfile.grade || '';
            if (schoolInput) schoolInput.value = userProfile.school || '';
            if (countryInput) countryInput.value = userProfile.country || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// ============================================================
// Program Selection - Click to select a program
// ============================================================
function setupProgramSelection() {
    var cards = document.querySelectorAll('.program-card');
    var paymentBtn = document.getElementById('paymentBtn');
    var selectedProgramName = document.getElementById('selectedProgramName');
    var selectedPrice = document.getElementById('selectedPrice');
    
    cards.forEach(function(card) {
        card.addEventListener('click', function() {
            cards.forEach(function(c) {
                c.classList.remove('selected');
            });
            
            card.classList.add('selected');
            selectedProgram = card.dataset.program;
            
            var price = card.dataset.price;
            var name = card.querySelector('.program-name').textContent;
            
            if (selectedPrice) selectedPrice.textContent = 'AED ' + price;
            if (selectedProgramName) selectedProgramName.textContent = name;
            if (paymentBtn) paymentBtn.disabled = false;
        });
    });
}

// ============================================================
// Setup Enrollment Form - Handle form submission
// ============================================================
function setupEnrollmentForm() {
    var form = document.getElementById('enrollmentForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!selectedProgram) {
            alert('Please select a program first.');
            return;
        }
        
        var formData = new FormData(form);
        var data = Object.fromEntries(formData.entries());
        
        var required = ['fullName', 'email', 'parentEmail', 'timezone', 'grade', 'country'];
        for (var i = 0; i < required.length; i++) {
            var field = required[i];
            if (!data[field] || data[field].trim() === '') {
                alert('Please fill in the "' + field + '" field.');
                return;
            }
        }
        
        var enrollmentData = {
            ...data,
            program: selectedProgram,
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email,
            status: 'pending_payment',
            createdAt: serverTimestamp()
        };
        
        window._enrollmentData = enrollmentData;
        proceedToPayment(enrollmentData);
    });
}

// ============================================================
// Proceed to Payment - Show payment options
// ============================================================
function proceedToPayment(enrollmentData) {
    var paymentSection = document.getElementById('paymentSection');
    var formSection = document.getElementById('formSection');
    
    if (paymentSection && formSection) {
        formSection.style.display = 'none';
        paymentSection.style.display = 'block';
        
        var summary = document.getElementById('paymentSummary');
        if (summary) {
            summary.innerHTML = '<div style="background:#f8f9ff;border-radius:12px;padding:1.5rem;text-align:center;">' +
                '<h3 style="margin-bottom:0.5rem;">📋 Enrollment Summary</h3>' +
                '<p><strong>Program:</strong> ' + enrollmentData.program + '</p>' +
                '<p><strong>Student:</strong> ' + enrollmentData.fullName + '</p>' +
                '<p><strong>Email:</strong> ' + enrollmentData.email + '</p>' +
                '<p><strong>Total:</strong> <span style="font-size:1.8rem;color:#6C3CE1;font-weight:700;">AED ' + getProgramPrice(enrollmentData.program) + '</span></p>' +
                '<button onclick="window.location.href=\'payment-scanner.html\'" style="padding:0.75rem 2rem;background:#6C3CE1;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-top:1rem;font-size:1rem;">' +
                '💳 Proceed to Payment</button>' +
                '</div>';
        }
    }
}

// ============================================================
// Get Program Price - Helper function
// ============================================================
function getProgramPrice(program) {
    var prices = {
        'grade10': '450/month',
        'grade11': '650/month',
        'grade12': '999/year'
    };
    return prices[program] || '0';
}

// ============================================================
// Handle Payment Success - Called from payment-scanner.js
// ============================================================
export async function handlePaymentSuccess(paymentDetails) {
    var user = auth.currentUser;
    if (!user) {
        alert('Please log in first.');
        return;
    }
    
    try {
        var enrollmentData = window._enrollmentData || {};
        
        await addDoc(collection(db, COLLECTIONS.enrollments), {
            userId: user.uid,
            userEmail: user.email,
            ...enrollmentData,
            paymentDetails: paymentDetails,
            status: 'active',
            enrolledAt: serverTimestamp()
        });
        
        await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
            isEnrolled: true,
            enrolledProgram: enrollmentData.program,
            enrolledAt: serverTimestamp()
        });
        
        window.location.href = 'payment-success.html';
        
    } catch (error) {
        console.error('Error processing enrollment:', error);
        alert('Error completing enrollment. Please contact support.');
    }
}

export { getProgramPrice, loadUserProfile };
