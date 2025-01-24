// Функция для загрузки описаний типов личности из CSV
async function loadTypeDescriptions() {
    try {
        const response = await fetch('/api/type-descriptions');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка при загрузки описаний:', error);
        return null;
    }
}

function getTypeSymbols(type1, type2) {
    return [type1, type2].sort().join('+');
}

function formatDescription(description) {
    const sections = {
        'Описание типа личности': [],
        'Характеристика': [],
        'Интересы': [],
        'Рекомендации для родителей': [],
        'Ресурсы и материалы': [],
        'Какая школа подходит?': [],
        'Возможные профессии в будущем': [],
        'Советы по воспитанию и развитию': [],
        'Итог для родителей': []
    };

    let currentSection = 'Описание типа личности';
    const lines = description.split('\n');

    lines.forEach(line => {
        const trimmedLine = line.trim();
        // Убираем черную точку в начале строки, если она есть
        const cleanLine = trimmedLine.replace(/^[•·]?\s*/, '');
        
        if (trimmedLine in sections) {
            currentSection = trimmedLine;
        } else if (cleanLine) {
            sections[currentSection].push(cleanLine);
        }
    });

    return Object.entries(sections)
        .filter(([_, content]) => content.length > 0)
        .map(([title, content]) => `
            <section>
                <h5>${title}</h5>
                <div class="section-content">
                    ${content.map(line => {
                        // Проверяем, является ли строка элементом списка
                        const isListItem = line.startsWith('•') || line.match(/^[-•·]\s/);
                        if (isListItem) {
                            return `<li>${line.replace(/^[-•·]\s/, '')}</li>`;
                        } else if (line.includes(':') && !line.endsWith(':')) {
                            const [label, text] = line.split(':');
                            return `<div class="highlight-box">
                                <strong>${label}:</strong>${text}
                            </div>`;
                        } else {
                            return `<p>${line}</p>`;
                        }
                    }).join('')}
                </div>
            </section>
        `).join('');
}

async function saveResults(personalityType, typeCode) {
    if (!personalityType || !typeCode) {
        console.error('Ошибка: отсутствуют данные для сохранения');
        return false;
    }

    try {
        const response = await fetch('/save-results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personality_type: personalityType,
                type_code: typeCode
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Ошибка сохранения:', data.error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Ошибка при сохранении результатов:', error);
        return false;
    }
}

async function displayResults(results) {
    // Загружаем описания типов
    const typeData = await loadTypeDescriptions();
    if (!typeData) {
        console.error('Не удалось загрузить описания типов');
        return;
    }

    const scoresContainer = document.getElementById('scores-container');
    const maxScore = Math.max(...Object.values(results));
    
    // Отображаем все категории с прогресс-барами
    const sortedResults = Object.entries(results)
        .sort(([,a], [,b]) => b - a);
    
    // Очищаем контейнер перед добавлением новых результатов
    scoresContainer.innerHTML = '';
    
    // Создаем карточки для каждого типа
    sortedResults.forEach(([category, score]) => {
        const percentage = (score / (maxScore * 1.2)) * 100;
        
        const scoreBar = document.createElement('div');
        scoreBar.className = 'score-bar';
        
        const categoryName = getCategoryName(category);
        // Добавляем многоточие, если название слишком длинное
        const truncatedName = categoryName.length > 20 ? categoryName.slice(0, 20) + '...' : categoryName;
        
        scoreBar.innerHTML = `
            <div class="score-label" title="${categoryName}">${truncatedName}</div>
            <div class="score-progress">
                <div class="score-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="score-value">${score} баллов</div>
        `;
        scoresContainer.appendChild(scoreBar);
    });

    // Получаем два ведущих типа
    const [firstType, secondType] = sortedResults.slice(0, 2).map(([type]) => type);
    const typeSymbols = [firstType, secondType].sort().join('+');

    // Находим соответствующее описание в данных из CSV
    const typeDescription = typeData.find(t => {
        const symbols = t.type_simbol.split('/');
        return symbols.includes(typeSymbols);
    });

    // Отображаем ведущие типы и их описание
    const topTypesContainer = document.getElementById('top-types');
    const descriptionsContainer = document.getElementById('type-descriptions');

    if (typeDescription) {
        topTypesContainer.innerHTML = `
            <div class="score-container">
                <div class="score-title">Ваш тип личности:</div>
                <h3>${typeDescription.type}</h3>
                <div class="type-code">${typeSymbols}</div>
            </div>
        `;
        
        descriptionsContainer.innerHTML = `
            <div class="type-description">
                <div class="profile-description">
                    ${formatDescription(typeDescription.discription)}
                </div>
            </div>
        `;

        // Сохраняем результаты в базу данных
        const saved = await saveResults(typeDescription.type, typeSymbols);
        if (!saved) {
            console.error('Не удалось сохранить результаты в базу данных');
            // Можно добавить уведомление для пользователя
        }
    } else {
        const firstTypeName = getCategoryName(firstType);
        const secondTypeName = getCategoryName(secondType);
        topTypesContainer.innerHTML = `
            <div class="score-container">
                <div class="score-title">Ваш тип личности:</div>
                <h3>${firstTypeName} + ${secondTypeName}</h3>
                <div class="type-code">${typeSymbols}</div>
            </div>
        `;
        descriptionsContainer.innerHTML = '<p>Описание для данной комбинации типов не найдено.</p>';
    }
}

// Функция для получения названия категории
function getCategoryName(category) {
    const categoryNames = {
        'R': 'Реалистический',
        'I': 'Исследовательский',
        'A': 'Артистический',
        'S': 'Социальный',
        'E': 'Предпринимательский',
        'C': 'Конвенциональный'
    };
    return categoryNames[category] || category;
}

// Получаем результаты из localStorage и отображаем их
const results = JSON.parse(localStorage.getItem('testResults')) || {};
displayResults(results);

async function downloadResultsPDF() {
    // Создаем временный контейнер для PDF
    const tempContainer = document.createElement('div');
    tempContainer.className = 'pdf-container';
    
    // Копируем нужные элементы
    const studentInfo = document.querySelector('.student-info').cloneNode(true);
    const title = document.querySelector('.survey-card h2').cloneNode(true);
    const scoresContainer = document.querySelector('.scores-container').cloneNode(true);
    const leadingTypes = document.querySelector('.leading-types').cloneNode(true);
    const typeDescriptions = document.querySelector('.type-descriptions').cloneNode(true);
    
    // Собираем всё в временный контейнер
    tempContainer.appendChild(studentInfo);
    tempContainer.appendChild(title);
    tempContainer.appendChild(scoresContainer);
    tempContainer.appendChild(leadingTypes);
    tempContainer.appendChild(typeDescriptions);
    
    // Настройки для PDF
    const opt = {
        margin: [15, 15],
        filename: 'результаты_теста.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollY: 0
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
        // Добавляем временный контейнер в body
        document.body.appendChild(tempContainer);
        
        // Добавляем класс для печати
        tempContainer.classList.add('printing');
        
        // Генерируем PDF
        await html2pdf().set(opt).from(tempContainer).save();
        
        // Удаляем временный контейнер
        document.body.removeChild(tempContainer);
    } catch (error) {
        console.error('Ошибка при создании PDF:', error);
        // Убеждаемся, что временный контейнер удален даже при ошибке
        if (document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer);
        }
    }
} 