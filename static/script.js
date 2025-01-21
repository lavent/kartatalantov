let currentQuestionIndex = 0;
let questions = [];
let answers = {};

// В начало файла добавим получение CSRF-токена
function getCSRFToken() {
    const tokenInput = document.querySelector('input[name="csrf_token"]');
    if (!tokenInput) {
        console.error('CSRF token input not found');
        return null;
    }
    return tokenInput.value;
}

function fetchWithCSRF(url, options = {}) {
    const token = getCSRFToken();
    if (!token) {
        throw new Error('CSRF token not found');
    }

    const defaultOptions = {
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': token
        },
        ...options,
        headers: {
            ...options.headers,
            'X-CSRF-TOKEN': token
        }
    };
    
    return fetch(url, defaultOptions);
}

// Загрузка вопросов при старте
fetch('/api/questions')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format');
        }
        questions = data;
        if (questions.length > 0) {
            document.getElementById('total-questions').textContent = questions.length;
            showQuestion(currentQuestionIndex);
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки вопросов:', error);
        document.getElementById('question-text').textContent = 'Ошибка загрузки вопросов. Пожалуйста, обновите страницу.';
    });

// В начале файла добавим функцию обновления прогресса
function updateProgress() {
    const progress = Math.min(Math.max((currentQuestionIndex / Math.max(questions.length, 1)) * 100, 0), 100);
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
}

function showQuestion(index) {
    if (!Array.isArray(questions) || index < 0 || index >= questions.length) {
        return;
    }

    const question = questions[index];
    if (!question || typeof question !== 'object') {
        return;
    }

    // Безопасное обновление текста
    const questionText = document.getElementById('question-text');
    questionText.textContent = question.text || 'Ошибка: текст вопроса отсутствует';
    
    updateProgress();
    
    const answersContainer = document.getElementById('answers-container');
    answersContainer.innerHTML = '';
    
    const standardAnswers = [
        { id: '1', text: 'Это совсем не про меня', weight: 1 },
        { id: '2', text: 'Скорее нет', weight: 2 },
        { id: '3', text: 'Скорее да', weight: 3 },
        { id: '4', text: 'Да, это точно про меня', weight: 4 }
    ];
    
    standardAnswers.forEach(answer => {
        const answerElement = document.createElement('div');
        answerElement.className = 'answer-option';
        answerElement.textContent = answer.text;
        
        // Безопасное создание обработчика
        const safeQuestionId = String(question.id);
        const safeCategoryKey = String(question.category?.key || '');
        answerElement.onclick = () => submitAnswer(safeQuestionId, answer.id, safeCategoryKey, answer.weight);
        
        answersContainer.appendChild(answerElement);
    });
}

function submitAnswer(questionId, answerId, categoryKey, weight) {
    // Валидация входных данных
    if (!questionId || !answerId || !categoryKey || typeof weight !== 'number') {
        console.error('Invalid answer data');
        return;
    }

    // Проверка допустимых значений weight
    if (weight < 1 || weight > 4) {
        console.error('Invalid weight value');
        return;
    }

    if (!answers[categoryKey]) {
        answers[categoryKey] = {};
    }

    answers[categoryKey][questionId] = {
        answerId: String(answerId),
        weight: Number(weight)
    };
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex < questions.length) {
        showQuestion(currentQuestionIndex);
    } else {
        // Если это был последний вопрос, анализируем результаты
        analyzeResults();
    }
}

function analyzeResults() {
    if (currentQuestionIndex < questions.length) {
        console.log('Тест еще не завершен');
        return;
    }

    try {
        console.log('Начинаем анализ результатов...');
        const categoryScores = {};
        for (const category in answers) {
            if (Object.prototype.hasOwnProperty.call(answers, category)) {
                let score = 0;
                const categoryAnswers = answers[category];
                
                for (const questionId in categoryAnswers) {
                    if (Object.prototype.hasOwnProperty.call(categoryAnswers, questionId)) {
                        const answer = categoryAnswers[questionId];
                        if (typeof answer.weight === 'number' && answer.weight >= 1 && answer.weight <= 4) {
                            score += answer.weight;
                        }
                    }
                }
                categoryScores[category] = score;
            }
        }

        console.log('Подсчитанные баллы:', categoryScores);

        let maxScore = 0;
        let dominantType = '';
        
        for (const category in categoryScores) {
            if (categoryScores[category] > maxScore) {
                maxScore = categoryScores[category];
                dominantType = category;
            }
        }

        console.log('Доминирующий тип:', dominantType);

        const resultData = {
            personality_type: dominantType,
            type_code: dominantType,
            scores: categoryScores
        };

        console.log('Отправляем данные на сервер:', resultData);

        const token = getCSRFToken();
        if (!token) {
            throw new Error('CSRF токен не найден');
        }

        fetch('/api/save-results', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token
            },
            body: JSON.stringify(resultData)
        })
        .then(response => {
            console.log('Получен ответ от сервера:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Ошибка сервера: ${response.status}, ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Получены данные:', data);
            if (data.success) {
                window.location.href = '/results';
            } else {
                throw new Error(data.error || 'Ошибка сохранения результатов');
            }
        })
        .catch(error => {
            console.error('Ошибка при сохранении результатов:', error);
            alert('Произошла ошибка при сохранении результатов. Пожалуйста, попробуйте еще раз.');
        });
    } catch (error) {
        console.error('Ошибка при анализе результатов:', error);
        alert('Произошла ошибка при обработке результатов. Пожалуйста, попробуйте еще раз.');
    }
} 