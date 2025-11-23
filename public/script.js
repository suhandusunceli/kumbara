// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    loadTotal();
    loadContributions();
    
    // Form submit
    document.getElementById('contributionForm').addEventListener('submit', handleSubmit);
});

// Toplam miktarı yükle
async function loadTotal() {
    try {
        const response = await fetch('/api/total');
        const data = await response.json();
        const total = parseFloat(data.total || 0);
        document.getElementById('totalAmount').textContent = formatCurrency(total);
    } catch (error) {
        console.error('Toplam yüklenirken hata:', error);
    }
}

// Katkıları yükle
async function loadContributions() {
    const listElement = document.getElementById('contributionsList');
    listElement.innerHTML = '<p class="loading">Yükleniyor...</p>';
    
    try {
        const response = await fetch('/api/contributions');
        const contributions = await response.json();
        
        if (contributions.length === 0) {
            listElement.innerHTML = '<div class="empty-state">Henüz katkı eklenmemiş. İlk katkıyı siz ekleyin! 🎉</div>';
            return;
        }
        
        listElement.innerHTML = contributions.map(contrib => `
            <div class="contribution-item">
                <div class="contribution-header">
                    <div>
                        <div class="contribution-name">${escapeHtml(contrib.name)}</div>
                        <div class="contribution-date">${formatDate(contrib.created_at)}</div>
                    </div>
                    <div class="contribution-amount">${formatCurrency(contrib.amount)}</div>
                </div>
                ${contrib.message ? `<div class="contribution-message">"${escapeHtml(contrib.message)}"</div>` : ''}
                <div class="contribution-actions">
                    <button class="btn-danger" onclick="deleteContribution(${contrib.id})">Sil</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Katkılar yüklenirken hata:', error);
        listElement.innerHTML = '<div class="error-message">Katkılar yüklenirken bir hata oluştu.</div>';
    }
}

// Form submit işlemi
async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        amount: document.getElementById('amount').value,
        message: document.getElementById('message').value.trim()
    };
    
    if (!formData.name || !formData.amount) {
        showMessage('Lütfen tüm zorunlu alanları doldurun.', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/contributions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showMessage('Katkı başarıyla eklendi! 🎉', 'success');
            document.getElementById('contributionForm').reset();
            loadTotal();
            loadContributions();
        } else {
            showMessage(data.error || 'Bir hata oluştu.', 'error');
        }
    } catch (error) {
        console.error('Katkı eklenirken hata:', error);
        showMessage('Katkı eklenirken bir hata oluştu.', 'error');
    }
}

// Katkı sil
async function deleteContribution(id) {
    if (!confirm('Bu katkıyı silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/contributions/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showMessage('Katkı silindi.', 'success');
            loadTotal();
            loadContributions();
        } else {
            showMessage(data.error || 'Silme işlemi başarısız.', 'error');
        }
    } catch (error) {
        console.error('Katkı silinirken hata:', error);
        showMessage('Katkı silinirken bir hata oluştu.', 'error');
    }
}

// Mesaj göster
function showMessage(message, type) {
    const existingMessage = document.querySelector('.success-message, .error-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    
    const formSection = document.querySelector('.form-section');
    formSection.insertBefore(messageDiv, formSection.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Para formatı
function formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
}

// Tarih formatı
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// HTML escape
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

