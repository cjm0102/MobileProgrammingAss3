document.addEventListener('DOMContentLoaded', () => {
    const foodDate = document.getElementById('foodDate');
    const foodInput = document.getElementById('foodInput');
    const addFoodButton = document.getElementById('addFoodButton');
    const calorieChartCtx = document.getElementById('calorieChart').getContext('2d');
    const calorieLimitInput = document.getElementById('calorieLimit');
    const setLimitButton = document.getElementById('setLimitButton');
    const logTableBody = document.getElementById('logTableBody');
    const clearLogButton = document.getElementById('clearLogButton');
    const totalCaloriesDisplay = document.getElementById('totalCaloriesDisplay');
    const carbsPercent = document.getElementById('carbsPercent');
    const proteinPercent = document.getElementById('proteinPercent');
    const fatsPercent = document.getElementById('fatsPercent');
    const otherPercent = document.getElementById('otherPercent');

    let calorieLimit = 2000;
    let totalCalories = 0;
    let calorieBreakdown = {carbohydrates: 0, fat: 0, protein: 0, other: 0};

    const calorieChart = new Chart(calorieChartCtx, {
        type: 'doughnut',
        data: {
            labels: ['Carbohydrates', 'Fat', 'Protein', 'Other'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    '#ffce56',
                    '#ff6384',
                    '#36a2eb',
                    '#9966ff'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });

    const fetchCalorieData = async (food) => {
        try {
            const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${food}`, {
                headers: { 'X-Api-Key': 'jx9aKZgsCoTscf8zhsob3Q==kFOEgNmM4XkefJY7' }
            });
            const data = await response.json();
            if (data.items.length > 0) {
                const item = data.items[0];
                return {
                    calories: item.calories,
                    carbohydrates: item.carbohydrates_total_g,
                    fat: item.fat_total_g,
                    protein: item.protein_g,
                    other: item.calories - (item.carbohydrates_total_g * 4 + item.fat_total_g * 9 + item.protein_g * 4)
                };
            } else {
                return {calories: 0, carbohydrates: 0, fat: 0, protein: 0, other: 0};
            }
        } catch (error) {
            console.error('Error fetching calorie data:', error);
            return {calories: 0, carbohydrates: 0, fat: 0, protein: 0, other: 0};
        }
    };

    const logUserInteraction = (date, time, food, calories, totalCalories) => {
        const logRow = document.createElement('tr');
        logRow.innerHTML = `
            <td>${date}</td>
            <td>${time}</td>
            <td>${food}</td>
            <td>${calories.toFixed(2)}</td>
            <td>${totalCalories.toFixed(2)}</td>
        `;
        logTableBody.appendChild(logRow);
        localStorage.setItem('userLog', logTableBody.innerHTML);
    };

    const updateChart = () => {
        const total = calorieBreakdown.carbohydrates + calorieBreakdown.fat + calorieBreakdown.protein + calorieBreakdown.other;
        const carbPercent = (calorieBreakdown.carbohydrates / total) * 100 || 0;
        const fatPercent = (calorieBreakdown.fat / total) * 100 || 0;
        const proteinPercentVal = (calorieBreakdown.protein / total) * 100 || 0;
        const otherPercentVal = (calorieBreakdown.other / total) * 100 || 0;

        carbsPercent.textContent = `${carbPercent.toFixed(2)}%`;
        proteinPercent.textContent = `${proteinPercentVal.toFixed(2)}%`;
        fatsPercent.textContent = `${fatPercent.toFixed(2)}%`;
        otherPercent.textContent = `${otherPercentVal.toFixed(2)}%`;

        calorieChart.data.datasets[0].data = [
            calorieBreakdown.carbohydrates,
            calorieBreakdown.fat,
            calorieBreakdown.protein,
            calorieBreakdown.other
        ];
        calorieChart.update();

        // Save chart data and percentages to localStorage
        localStorage.setItem('calorieBreakdown', JSON.stringify(calorieBreakdown));
        localStorage.setItem('totalCalories', totalCalories.toFixed(2));
        localStorage.setItem('percentages', JSON.stringify({
            carbs: carbPercent.toFixed(2),
            protein: proteinPercentVal.toFixed(2),
            fat: fatPercent.toFixed(2),
            other: otherPercentVal.toFixed(2)
        }));
    };

    const resetData = () => {
        totalCalories = 0;
        calorieBreakdown = {carbohydrates: 0, fat: 0, protein: 0, other: 0};
        totalCaloriesDisplay.textContent = '0 kcal';
        updateChart();
    };

    const addFood = async () => {
        const food = foodInput.value.trim();
        const date = foodDate.value || new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString();

        if (food) {
            const data = await fetchCalorieData(food);
            calorieBreakdown.carbohydrates += data.carbohydrates;
            calorieBreakdown.fat += data.fat;
            calorieBreakdown.protein += data.protein;
            calorieBreakdown.other += data.other;
            totalCalories += data.calories;
            totalCaloriesDisplay.textContent = `${totalCalories.toFixed(2)} kcal`;
            updateChart();

            logUserInteraction(date, time, food, data.calories, totalCalories);

            // Check if calories exceed limit and alert
            if (totalCalories > calorieLimit) {
                alert(`Warning: Total calorie intake (${totalCalories.toFixed(2)}) exceeds the daily limit (${calorieLimit})!`);
            }

            foodInput.value = ''; // Clear the input field after adding food
        }
    };

    const setCalorieLimit = () => {
        const limit = parseInt(calorieLimitInput.value, 10);
        if (!isNaN(limit)) {
            calorieLimit = limit;
            logUserInteraction(new Date().toISOString().split('T')[0], new Date().toLocaleTimeString(), 'Set Limit', 0, calorieLimit);
          
        }
    };

    const clearLog = () => {
        logTableBody.innerHTML = '';
        localStorage.removeItem('userLog');
        localStorage.removeItem('calorieBreakdown');
        localStorage.removeItem('totalCalories');
        localStorage.removeItem('percentages');
        resetData(); // Reset chart and percentage data
    };

    foodDate.addEventListener('change', resetData);
    addFoodButton.addEventListener('click', addFood);
    setLimitButton.addEventListener('click', setCalorieLimit);
    clearLogButton.addEventListener('click', clearLog);

    // Load user interaction log from localStorage
    if (localStorage.getItem('userLog')) {
        logTableBody.innerHTML = localStorage.getItem('userLog');
    }

    // Load chart data and percentages from localStorage
    if (localStorage.getItem('calorieBreakdown')) {
        calorieBreakdown = JSON.parse(localStorage.getItem('calorieBreakdown'));
        totalCalories = parseFloat(localStorage.getItem('totalCalories')) || 0;
        const percentages = JSON.parse(localStorage.getItem('percentages'));

        totalCaloriesDisplay.textContent = `${totalCalories.toFixed(2)} kcal`;
        carbsPercent.textContent = `${percentages.carbs}%`;
        proteinPercent.textContent = `${percentages.protein}%`;
        fatsPercent.textContent = `${percentages.fat}%`;
        otherPercent.textContent = `${percentages.other}%`;

        updateChart();
    }
});
