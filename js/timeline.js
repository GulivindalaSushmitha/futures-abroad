document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('assessmentForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const grade = document.querySelector('input[name="grade"]:checked');
            if (!grade) {
                alert('Please select your grade.');
                return;
            }
            
            let message = '📚 Your Personalized Roadmap\n\n';
            message += `Grade: ${grade.value}\n`;
            message += `Interests: ${Array.from(document.querySelectorAll('.tag.active')).map(t => t.dataset.tag).join(', ') || 'None'}\n\n`;
            
            if (grade.value === '10') {
                message += '✅ Focus: Build foundation, explore activities, start portfolio';
            } else if (grade.value === '11') {
                message += '✅ Focus: University shortlisting, counseling preparation';
            } else {
                message += '✅ Focus: Application support, deadlines, essays';
            }
            
            alert(message);
        });
    }
});