// Transaction management
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let editingId = null;
let chart;

document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    loadTransactions();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);
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
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
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
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('totalAmount').textContent = `$${total.toFixed(2)}`;
}

function updateChart() {
    const categoryTotals = {};
    transactions.forEach(t => {
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
        type: 'pie',
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
            }
        }
    });
    
    updateChart();
    updateTotal();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}