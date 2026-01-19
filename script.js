// Transaction management
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let editingId = null;
let chart;
let currentFilter = 'all'; // 'all' or 'monthly'
let currentChartType = 'pie'; // 'pie' or 'doughnut'
let categoryFilter = null; // null or category name

document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    loadTransactions();
    setupEventListeners();
    // Set initial values
    document.getElementById('timeFilter').value = currentFilter;
    document.getElementById('chartType').value = currentChartType;
});

function setupEventListeners() {
    document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('timeFilter').addEventListener('change', handleTimeFilterChange);
    document.getElementById('chartType').addEventListener('change', handleChartTypeChange);
}

function handleTimeFilterChange(e) {
    currentFilter = e.target.value;
    loadTransactions();
    updateChart();
    updateTotal();
}

function handleChartTypeChange(e) {
    currentChartType = e.target.value;
    updateChartType();
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    
    if (editingId !== null) {
        // Update existing transaction
        const index = transactions.findIndex(t => t.id === editingId);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], description, amount, category, date };
        }
        editingId = null;
        document.querySelector('button[type="submit"]').textContent = 'Add Transaction';
    } else {
        // Add new transaction
        const transaction = {
            id: Date.now(),
            description,
            amount,
            category,
            date
        };
        transactions.push(transaction);
    }
    
    saveTransactions();
    loadTransactions();
    updateChart();
    updateTotal();
    
    // Reset form
    document.getElementById('transactionForm').reset();
}

function loadTransactions() {
    const tbody = document.getElementById('transactionBody');
    tbody.innerHTML = '';
    
    let filteredTransactions = transactions;
    
    // Filter by time
    if (currentFilter === 'monthly') {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        filteredTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
    }
    
    // Filter by category if selected
    if (categoryFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    
    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        const categoryClass = 'category-' + transaction.category.toLowerCase().replace(/\s+/g, '-');
        row.classList.add(categoryClass);
        row.innerHTML = `
            <td>${transaction.description}</td>
            <td>$${transaction.amount.toFixed(2)}</td>
            <td>${transaction.category}</td>
            <td>${formatDate(transaction.date)}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editTransaction(${transaction.id})">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteTransaction(${transaction.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        document.getElementById('description').value = transaction.description;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('category').value = transaction.category;
        document.getElementById('date').value = transaction.date;
        
        editingId = id;
        document.querySelector('button[type="submit"]').textContent = 'Update Transaction';
    }
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        loadTransactions();
        updateChart();
        updateTotal();
    }
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function updateTotal() {
    let filteredTransactions = transactions;
    
    // Filter by time
    if (currentFilter === 'monthly') {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        filteredTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
    }
    
    // Filter by category if selected
    if (categoryFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    
    const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const labelText = categoryFilter ? `Total ${categoryFilter} Expenses (${currentFilter === 'monthly' ? 'This Month' : 'All Time'}):` : `Total ${currentFilter === 'monthly' ? 'Monthly' : 'All Time'} Expenses:`;
    document.querySelector('.total .label').textContent = labelText;
    document.getElementById('totalAmount').textContent = `$${total.toFixed(2)}`;
}

function updateChart() {
    let filteredTransactions = transactions;
    
    // Filter by time
    if (currentFilter === 'monthly') {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        filteredTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
    }
    
    const categoryTotals = {};
    filteredTransactions.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
    ];
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors.slice(0, labels.length);
    chart.data.datasets[0].hoverBackgroundColor = colors.slice(0, labels.length);
    chart.update();
}

function initializeChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    chart = new Chart(ctx, {
        type: currentChartType,
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                hoverBackgroundColor: []
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'white'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += '$' + context.parsed.toFixed(2);
                            return label;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 2000,
                easing: 'easeOutBounce'
            },
            hover: {
                animationDuration: 500
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            },
            onClick: (event, activeElements) => {
                if (activeElements.length > 0) {
                    const index = activeElements[0].index;
                    const category = chart.data.labels[index];
                    toggleCategoryFilter(category);
                }
            }
        }
    });
    
    updateChart();
    updateTotal();
}

function updateChartType() {
    chart.config.type = currentChartType;
    chart.update();
}

function toggleCategoryFilter(category) {
    if (categoryFilter === category) {
        categoryFilter = null;
    } else {
        categoryFilter = category;
    }
    loadTransactions();
    updateTotal();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}