/* ===== COMMON JAVASCRIPT ===== */

// Mobile nav toggle
function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    if (!toggle || !mobileNav) return;

    toggle.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
        toggle.textContent = mobileNav.classList.contains('open') ? '✕' : '☰';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            toggle.textContent = '☰';
        });
    });
}

// Back to top
function initBackTop() {
    const btn = document.querySelector('.back-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('show', window.scrollY > 300);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// Active sidebar / TOC link tracking
function initScrollSpy() {
    const sections = document.querySelectorAll('[data-section]');
    const tocLinks = document.querySelectorAll('.toc a, .sidebar-link');
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('data-section');
                tocLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                });
            }
        });
    }, { rootMargin: '-20% 0px -70% 0px' });

    sections.forEach(s => observer.observe(s));
}

// Copy code button
function initCodeCopy() {
    document.querySelectorAll('.code-copy').forEach(btn => {
        btn.addEventListener('click', () => {
            const pre = btn.closest('.code-block').querySelector('pre');
            const text = pre ? pre.innerText : '';
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = '✓ Copied!';
                setTimeout(() => btn.textContent = 'Copy', 2000);
            });
        });
    });
}

// Animate on scroll
function initAnimations() {
    const els = document.querySelectorAll('.card, .topic-card, .question-block');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    els.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(16px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

// ===== QUIZ ENGINE =====
class Quiz {
    constructor(questions, containerId) {
        this.questions = questions;
        this.container = document.getElementById(containerId);
        this.current = 0;
        this.score = 0;
        this.answered = false;
        if (this.container) this.render();
    }

    render() {
        if (this.current >= this.questions.length) {
            this.showResult(); return;
        }

        const q = this.questions[this.current];
        const pct = Math.round((this.current / this.questions.length) * 100);

        this.container.innerHTML = `
      <div class="quiz-header">
        <span class="quiz-progress">ප්‍රශ්නය ${this.current + 1} / ${this.questions.length}</span>
        <span class="quiz-progress">ලකුණු: <strong>${this.score}</strong></span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="question-text">${q.question}</div>
      <ul class="options-list">
        ${q.options.map((opt, i) => `
          <li>
            <button class="option-btn" data-index="${i}">
              <span class="option-letter">${String.fromCharCode(65 + i)}</span>
              ${opt}
            </button>
          </li>
        `).join('')}
      </ul>
      <div class="explanation-box" id="exp-box">${q.explanation || ''}</div>
      <div class="quiz-nav">
        <button class="btn btn-primary" id="next-btn" style="display:none">
          ${this.current < this.questions.length - 1 ? 'ඊළඟ ›' : 'ප්‍රතිඵල බලන්න'}
        </button>
      </div>
    `;

        this.answered = false;

        this.container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.answered) return;
                this.answered = true;
                const idx = parseInt(btn.dataset.index);
                const correct = q.correct;

                this.container.querySelectorAll('.option-btn').forEach((b, i) => {
                    b.disabled = true;
                    if (i === correct) b.classList.add('correct');
                    if (i === idx && idx !== correct) b.classList.add('wrong');
                });

                if (idx === correct) this.score++;

                const expBox = document.getElementById('exp-box');
                if (expBox) expBox.classList.add('show');

                const nextBtn = document.getElementById('next-btn');
                if (nextBtn) nextBtn.style.display = 'inline-flex';
            });
        });

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.current++;
                this.render();
            });
        }
    }

    showResult() {
        const pct = Math.round((this.score / this.questions.length) * 100);
        let msg = '', color = '';
        if (pct >= 80) { msg = '🎉 විශිෂ්ට! ඔබ හොඳින් ඉගෙන ගෙන ඇත!'; color = '#2e7d32'; }
        else if (pct >= 60) { msg = '👍 හොඳයි! තව ටිකක් ඉගෙනීම් කරන්න.'; color = '#f57c00'; }
        else { msg = '📚 ඉගෙනීමේ ද්‍රව්‍ය නැවත බලන්න.'; color = '#c62828'; }

        this.container.innerHTML = `
      <div class="result-panel">
        <div class="result-score" style="color:${color}">${pct}%</div>
        <div class="result-msg">${msg}</div>
        <p style="color:#666;margin-bottom:24px">${this.questions.length}ෙන් ${this.score}ක් නිවැරදිව ඇත</p>
        <button class="btn btn-primary" onclick="location.reload()">🔄 නැවත උත්සාහ කරන්න</button>
      </div>
    `;
    }
}

// Answer reveal for exam paper
function initAnswerReveal() {
    document.querySelectorAll('.answer-area').forEach(area => {
        const answer = area.getAttribute('data-answer');
        area.addEventListener('click', () => {
            if (!area.classList.contains('revealed')) {
                area.innerHTML = `<strong>පිළිතුර:</strong><br><br>${answer}`;
                area.classList.add('revealed');
            }
        });
    });
}

// Active nav link
function setActiveNav() {
    const current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
        const href = a.getAttribute('href').split('/').pop();
        a.classList.toggle('active', href === current);
    });
}

// Init all
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initBackTop();
    initScrollSpy();
    initCodeCopy();
    initAnimations();
    initAnswerReveal();
    setActiveNav();
});