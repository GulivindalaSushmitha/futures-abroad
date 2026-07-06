// ============================================================
// js/enrollment.js - Enrollment & Payment (Phase 6)
// ============================================================

import { 
    db, auth, COLLECTIONS,
    collection, doc, getDoc, setDoc, updateDoc, addDoc,
    serverTimestamp, onAuthStateChanged 
} from './firebase-config.js';

// ============================================================
// State
// ============================================================
let selectedProgram = null;
let userProfile = null;

// ============================================================
// Initialize Page
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
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
        const userDoc = await getDoc(doc(db, COLLECTIONS.users, userId));
        if (userDoc.exists()) {
            userProfile = userDoc.data();
            
            // Pre-fill form with user data
            const fullNameInput = document.getElementById('fullName');
            const emailInput = document.getElementById('email');
            const gradeInput = document.getElementById('grade');
            const schoolInput = document.getElementById('school');
            const countryInput = document.getElementById('country');
            
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
    const cards = document.querySelectorAll('.program-card');
    const paymentBtn = document.getElementById('paymentBtn');
    const selectedProgramName = document.getElementById('selectedProgramName');
    const selectedPrice = document.getElementById('selectedPrice');
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove selection from all cards
            cards.forEach(c => c.classList.remove('selected'));
            
            // Select this card
            card.classList.add('selected');
            selectedProgram = card.dataset.program;
            
            // Update UI
            const price = card.dataset.price;
            const name = card.querySelector('.program-name').textContent;
            
            if (selectedPrice) selectedPrice.textContent = `AED ${price}`;
            if (selectedProgramName) selectedProgramName.textContent = name;
            if (paymentBtn) paymentBtn.disabled = false;
        });
    });
}

// ============================================================
// Setup Enrollment Form - Handle form submission
// ============================================================
function setupEnrollmentForm() {
    const form = document.getElementById('enrollmentForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check if a program is selected
        if (!selectedProgram) {
            alert('Please select a program first.');
            return;
        }
        
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate required fields
        const required = ['fullName', 'email', 'parentEmail', 'timezone', 'grade', 'country'];
        for (const field of required) {
            if (!data[field] || data[field].trim() === '') {
                alert(`Please fill in the "${field}" field.`);
                return;
            }
        }
        
        // Build enrollment data
        const enrollmentData = {
            ...data,
            program: selectedProgram,
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email,
            status: 'pending_payment',
            createdAt: serverTimestamp()
        };
        
        // Store for use in payment page
        window._enrollmentData = enrollmentData;
        
        // Proceed to payment
        proceedToPayment(enrollmentData);
    });
}

// ============================================================
// Proceed to Payment - Show payment options
// ============================================================
function proceedToPayment(enrollmentData) {
    const paymentSection = document.getElementById('paymentSection');
    const formSection = document.getElementById('formSection');
    
    if (paymentSection && formSection) {
        // Hide form, show payment
        formSection.style.display = 'none';
        paymentSection.style.display = 'block';
        
        // Build payment summary
        const summary = document.getElementById('paymentSummary');
        if (summary) {
            summary.innerHTML = `
                <div style="background:#f8f9ff;border-radius:12px;padding:1.5rem;text-align:center;">
                    <h3 style="margin-bottom:0.5rem;">📋 Enrollment Summary</h3>
                    <p><strong>Program:</strong> ${enrollmentData.program}</p>
                    <p><strong>Student:</strong> ${enrollmentData.fullName}</p>
                    <p><strong>Email:</strong> ${enrollmentData.email}</p>
                    <p><strong>Total:</strong> <span style="font-size:1.8rem;color:#667eea;font-weight:700;">AED ${getProgramPrice(enrollmentData.program)}</span></p>
                    <button onclick="window.location.href='payment-scanner.html'" 
                            style="padding:0.75rem 2rem;background:#667eea;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-top:1rem;font-size:1rem;">
                        💳 Proceed to Payment
                    </button>
                </div>
            `;
        }
    }
}

// ============================================================
// Get Program Price - Helper function
// ============================================================
function getProgramPrice(program) {
    const prices = {
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
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in first.');
        return;
    }
    
    try {
        const enrollmentData = window._enrollmentData || {};
        
        // Save enrollment to Firestore
        await addDoc(collection(db, COLLECTIONS.enrollments), {
            userId: user.uid,
            userEmail: user.email,
            ...enrollmentData,
            paymentDetails: paymentDetails,
            status: 'active',
            enrolledAt: serverTimestamp()
        });
        
        // Update user profile
        await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
            isEnrolled: true,
            enrolledProgram: enrollmentData.program,
            enrolledAt: serverTimestamp()
        });
        
        // Redirect to success page
        window.location.href = 'payment-success.html';
        
    } catch (error) {
        console.error('Error processing enrollment:', error);
        alert('Error completing enrollment. Please contact support.');
    }
}

// ============================================================
// Exports
// ============================================================
export { getProgramPrice, loadUserProfile };
