// ============================================
// ASSESSMENT FORM HANDLING
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const assessmentForm = document.getElementById('assessmentForm');
    
    if (assessmentForm) {
        // Auto-submit on selection (optional)
        const gradeInputs = document.querySelectorAll('input[name="grade"]');
        gradeInputs.forEach(input => {
            input.addEventListener('change', function() {
                // Auto highlight selected
                const parent = this.closest('.options-grid');
                if (parent) {
                    parent.querySelectorAll('.option-btn').forEach(btn => {
                        const radio = btn.querySelector('input');
                        if (radio && radio.checked) {
                            btn.style.borderColor = 'var(--primary)';
                        } else {
                            btn.style.borderColor = '';
                        }
                    });
                }
            });
        });
        
        // Tag selection visual feedback
        const tags = document.querySelectorAll('.tag');
        tags.forEach(tag => {
            tag.addEventListener('click', function() {
                this.classList.toggle('active');
            });
        });
        
        // Form submission
        assessmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const grade = document.querySelector('input[name="grade"]:checked');
            const selectedTags = document.querySelectorAll('.tag.active');
            const goal = document.getElementById('goalSelect');
            
            if (!grade) {
                showAssessmentError('Please select your grade.');
                return;
            }
            
            // Build result
            let resultMessage = '🎯 Your Personalized Roadmap\n\n';
            resultMessage += `📚 Grade: ${grade.value}\n`;
            resultMessage += `🎯 Goal: ${goal ? goal.value || 'Not specified' : 'Not specified'}\n`;
            
            if (selectedTags.length > 0) {
                const interests = Array.from(selectedTags).map(tag => tag.dataset.tag).join(', ');
                resultMessage += `💡 Interests: ${interests}\n`;
            }
            
            resultMessage += '\n📋 Recommended Focus Areas:\n';
            
            if (grade.value === '10') {
                resultMessage += '✅ Phase 1-2: Build your foundation\n';
                resultMessage += '✅ Explore activities that match your interests\n';
                resultMessage += '✅ Start building your portfolio\n';
                resultMessage += '\n🔮 Next Step: Create your account to get started!';
            } else if (grade.value === '11') {
                resultMessage += '✅ Phase 5: University shortlisting\n';
                resultMessage += '✅ Start thinking about university applications\n';
                resultMessage += '✅ Consider Futures Abroad counseling\n';
                resultMessage += '\n🔮 Next Step: Book a university planning session!';
            } else if (grade.value === '12') {
                resultMessage += '✅ Phase 6: Application support\n';
                resultMessage += '✅ Focus on deadlines and essays\n';
                resultMessage += '✅ Connect with Futures Abroad counselors\n';
                resultMessage += '\n🔮 Next Step: Get expert application support!';
            }
            
            // Show result
            alert(resultMessage);
            
            // Redirect to signup
            // window.location.href = 'signup.html';
        });
    }
});

function showAssessmentError(message) {
    const existing = document.querySelector('.assessment-error');
    if (existing) existing.remove();
    
    const error = document.createElement('div');
    error.className = 'assessment-error';
    error.style.cssText = 'background:#FEE2E2;color:#DC2626;padding:12px 16px;border-radius:12px;font-size:14px;margin-bottom:16px;';
    error.textContent = message;
    
    const form = document.getElementById('assessmentForm');
    if (form) {
        form.insertBefore(error, form.firstChild);
    }
}

// ============================================
// SELF-ASSESSMENT QUIZ (Mini)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const quizBtn = document.querySelector('.assessment-mini .btn');
    if (quizBtn) {
        quizBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const assessmentSection = document.getElementById('assessment');
            if (assessmentSection) {
                assessmentSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});