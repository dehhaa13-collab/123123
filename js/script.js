/**
 * Бриф цільової аудиторії — Frontend Logic
 * Адаптовано під 26 питань брифу ЦА для Reels.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Вставте ваш URL Google Apps Script сюди
    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbylMVblk4YQALxBg1qMtV-fd7smNdeWYI_0FZMqAF-EoMHQKYa1l3aZ-oiE3rXIrDq8/exec';
    const STORAGE_KEY = 'brief_ca_form_draft';
    const FETCH_TIMEOUT = 15000;

    const form = document.getElementById('briefForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const retryBtn = document.getElementById('retryBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    const autosaveIndicator = document.getElementById('autosaveIndicator');

    // Обов'язкові поля
    const REQUIRED_FIELDS = ['q0','q1','q2','q3','q4','q5','q7','q8','q10','q11','q12','q13','q15','q16','q17','q18','q20','q21','q23','q25'];
    const TOTAL_QUESTIONS = 26;
    const TOTAL_FIELDS = 27;
    let isSubmitting = false;
    let saveTimeout = null;

    const VALIDATION_MESSAGES = {
        q0: 'Вкажіть ваше ПІБ',
        q1: 'Вкажіть назву сегмента / проєкту',
        q2: 'Вкажіть назву проєкту або клієнта',
        q3: 'Опишіть ваш продукт',
        q4: 'Вкажіть конкретний результат клієнта',
        q5: 'Опишіть відмінності від конкурентів',
        q7: 'Опишіть портрет вашого клієнта',
        q8: 'Опишіть звичайний день клієнта',
        q10: 'Опишіть образ, який будує клієнт',
        q11: 'Вкажіть головний біль клієнта',
        q12: 'Опишіть страхи клієнта',
        q13: 'Розкажіть, що клієнт вже пробував',
        q15: 'Опишіть, що дратує клієнта',
        q16: 'Вкажіть справжнє бажання клієнта',
        q17: 'Опишіть тригерний момент',
        q18: 'Опишіть життя після вирішення проблеми',
        q20: 'Вкажіть заперечення клієнта',
        q21: 'Опишіть причини недовіри',
        q23: 'Що змусить зупинити скрол?',
        q25: 'Який контент викликає довіру?'
    };

    // ─── Автозбереження ───
    function saveDraft() {
        const data = {};
        for (let i = 0; i <= TOTAL_QUESTIONS; i++) {
            const field = document.getElementById(`q${i}`);
            if (field && field.value.trim()) data[`q${i}`] = field.value;
        }
        if (Object.keys(data).length > 0) {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); showAutosave(); } catch(e) {}
        }
    }

    function restoreDraft() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;
            const data = JSON.parse(saved);
            let restored = false;
            for (const [key, value] of Object.entries(data)) {
                const field = document.getElementById(key);
                if (field && !field.value) {
                    field.value = value;
                    restored = true;
                    if (field.tagName === 'TEXTAREA') autoResizeTextarea(field);
                }
            }
            if (restored) {
                updateProgress();
                updateFilledBadges();
                document.querySelectorAll('textarea').forEach(ta => updateCharCount(ta));
            }
        } catch(e) {}
    }

    function clearDraft() { try { localStorage.removeItem(STORAGE_KEY); } catch(e) {} }

    function showAutosave() {
        if (!autosaveIndicator) return;
        autosaveIndicator.textContent = 'Збережено';
        autosaveIndicator.classList.add('visible');
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => autosaveIndicator.classList.remove('visible'), 2000);
    }

    let debounceSaveTimer = null;
    function debounceSave() { clearTimeout(debounceSaveTimer); debounceSaveTimer = setTimeout(saveDraft, 500); }

    // ─── Авторозмір textarea ───
    function autoResizeTextarea(el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 400) + 'px';
    }

    // ─── Лічильник символів ───
    function updateCharCount(field) {
        const counter = document.querySelector(`.char-count[data-for="${field.id}"]`);
        if (counter) {
            const len = field.value.length;
            if (len > 0) { counter.textContent = `${len} символів`; counter.classList.add('active'); }
            else { counter.textContent = ''; counter.classList.remove('active'); }
        }
    }

    // ─── Бейджі ───
    function updateFilledBadges() {
        for (let i = 0; i <= TOTAL_QUESTIONS; i++) {
            const field = document.getElementById(`q${i}`);
            const group = field?.closest('.form-group');
            if (field && group) group.classList.toggle('is-filled', field.value.trim().length > 0);
        }
    }

    // ─── Прогрес-бар ───
    function updateProgress() {
        let filled = 0;
        for (let i = 0; i <= TOTAL_QUESTIONS; i++) {
            const field = document.getElementById(`q${i}`);
            if (field && field.value.trim().length > 0) filled++;
        }
        const percent = Math.round((filled / TOTAL_FIELDS) * 100);
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${filled} з ${TOTAL_FIELDS} питань`;
        if (progressBar) progressBar.setAttribute('aria-valuenow', filled);
    }

    // ─── Обробники полів ───
    for (let i = 0; i <= TOTAL_QUESTIONS; i++) {
        const field = document.getElementById(`q${i}`);
        if (!field) continue;
        field.addEventListener('input', () => { updateProgress(); updateFilledBadges(); debounceSave(); });
        if (field.tagName === 'TEXTAREA') {
            field.addEventListener('input', () => { autoResizeTextarea(field); updateCharCount(field); });
        }
    }

    // ─── Валідація ───
    function validateForm() {
        let isValid = true;
        let firstError = null;
        document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
        document.querySelectorAll('.form-group.has-error').forEach(el => el.classList.remove('has-error'));

        REQUIRED_FIELDS.forEach(id => {
            const field = document.getElementById(id);
            const errorEl = document.getElementById(`${id}-error`);
            if (field && field.value.trim() === '') {
                isValid = false;
                field.closest('.form-group').classList.add('has-error');
                if (errorEl) { errorEl.textContent = VALIDATION_MESSAGES[id] || 'Це поле обов\'язкове'; errorEl.classList.add('visible'); }
                if (!firstError) firstError = field;
            }
        });

        if (!isValid && firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => firstError.focus({ preventScroll: true }), 400);
        }
        return isValid;
    }

    // Прибираємо помилку при введенні
    REQUIRED_FIELDS.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.addEventListener('input', () => {
                if (field.value.trim() !== '') {
                    field.closest('.form-group').classList.remove('has-error');
                    const errorEl = document.getElementById(`${id}-error`);
                    if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
                }
            });
        }
    });

    // ─── Надсилання ───
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!validateForm()) return;

        isSubmitting = true;
        setLoadingState(true);
        errorMessage.classList.add('hidden');

        const data = {};
        for (let i = 0; i <= TOTAL_QUESTIONS; i++) {
            const field = document.getElementById(`q${i}`);
            if (field) data[field.name] = field.value.trim();
        }

        try {
            if (WEBHOOK_URL === 'ВАШ_ВЕБХУК_URL_СЮДИ') {
                console.warn('⚠️ ВЕБХУК НЕ ПІДКЛЮЧЕНО! Симулюємо надсилання.');
                console.table(data);
                await new Promise(r => setTimeout(r, 2000));
                showSuccess();
                return;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

            await fetch(WEBHOOK_URL, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(data), redirect: 'follow', signal: controller.signal
            });
            clearTimeout(timeoutId);
            showSuccess();
        } catch (error) {
            console.error('Помилка надсилання:', error);
            showError();
        }
    });

    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            isSubmitting = false;
            setLoadingState(false);
            errorMessage.classList.add('hidden');
            submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    function setLoadingState(loading) {
        submitBtn.disabled = loading;
        if (loading) { btnText.classList.add('hidden'); btnLoader.classList.remove('hidden'); }
        else { btnText.classList.remove('hidden'); btnLoader.classList.add('hidden'); }
    }

    function showSuccess() {
        form.classList.add('hidden');
        const header = document.getElementById('formHeader');
        if (header) header.classList.add('hidden');
        successMessage.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        clearDraft();
    }

    function showError() {
        isSubmitting = false;
        setLoadingState(false);
        errorMessage.classList.remove('hidden');
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // ─── Анімація секцій ───
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.form-section').forEach(section => observer.observe(section));

    // ─── Захист від втрати даних ───
    window.addEventListener('beforeunload', (e) => {
        if (isSubmitting) return;
        let hasFilled = false;
        for (let i = 0; i <= TOTAL_QUESTIONS; i++) {
            const field = document.getElementById(`q${i}`);
            if (field && field.value.trim().length > 0) { hasFilled = true; break; }
        }
        if (hasFilled && successMessage.classList.contains('hidden')) {
            saveDraft(); e.preventDefault(); e.returnValue = '';
        }
    });

    // ─── Ініціалізація ───
    restoreDraft();
    updateProgress();
    updateFilledBadges();
});
